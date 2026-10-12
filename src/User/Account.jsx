import React, {
  useState, useEffect, useCallback, useMemo, useTransition, useDeferredValue, memo, Suspense, lazy,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiUser, FiMapPin, FiBox, FiTool, FiEdit2, FiTrash2, FiMail, FiPhone, FiPlus, FiInfo, FiCalendar,
  FiDollarSign, FiHome, FiXCircle, FiZap, FiCheckCircle, FiCreditCard, FiTruck, FiCheck, FiShield,
  FiNavigation, FiList, FiBell, FiSearch, FiClock, FiExternalLink, FiPieChart, FiTrendingUp, FiTarget,
  FiSend, FiAward, FiCompass, FiGlobe, FiX,
} from 'react-icons/fi';
import { RiLogoutBoxRLine, RiVerifiedBadgeLine } from 'react-icons/ri';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { useAppLanguage, languageDirection } from '../utils/useAppLanguage';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import {
  UI3D_CSS, Defs3D, Glyph3D, Scene3D, Btn3D, Chip3D, InfoRow, EmptyState, ProgressBar3D, Modal3D,
  Pagination3D, Select3D, Field, cardCls, tileCls, inputCls,
} from '../components/Ui3D';

/* heavy / rarely used pieces load on demand */
const Hero = lazy(() => import('../components/Hero'));
const MapPicker = lazy(() => import('./AccountMap'));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } });
const LIVE_POLL_MS = 20_000; // only for orders / repairs / notifications; paused in background tabs by react-query

/* ───────────── helpers ───────────── */
const ACCOUNT_TRANSLATIONS = { en: enTranslations.account, ar: arTranslations.account, fr: frTranslations.account };
const tr = (lang, key) => ACCOUNT_TRANSLATIONS[lang]?.[key] || ACCOUNT_TRANSLATIONS.en?.[key] || key;
const LANGUAGES = [['en', 'English'], ['ar', 'العربية'], ['fr', 'Français']];

const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '') || v === 0;
const unwrap = (res) => { const d = res.data?.content ?? res.data ?? []; return Array.isArray(d) ? d : []; };
const dayOf = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); };
const fmtShort = (v) => new Date(v).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtFull = (v) => new Date(v).toLocaleString('en-EG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Cairo' });
const directionsUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

/* sweetalert2 is only needed on interaction – never on first paint */
let swalPromise;
const loadSwal = () => (swalPromise ||= import('sweetalert2').then((m) => m.default || m));
const toast = (o) => loadSwal().then((S) => S.fire({ toast: true, position: 'top-end', timer: 1800, showConfirmButton: false, ...o }));
const ask = (o) => loadSwal().then((S) => S.fire({ icon: 'warning', showCancelButton: true, ...o }));

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED'];
const REPAIR_STEPS = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'DEVICE_COLLECTED', 'REPAIRING', 'REPAIR_COMPLETED', 'DEVICE_DELIVERED'];
const ORDER_BAD = new Set(['CANCELLED']);
const REPAIR_BAD = new Set(['CANCELLED', 'FAILED', 'QUOTE_REJECTED']);
const DONE = new Set(['DELIVERED', 'DEVICE_DELIVERED', 'CANCELLED', 'FAILED', 'QUOTE_REJECTED']);
const ORDER_STATUSES = [...ORDER_STEPS, 'CANCELLED'];
const REPAIR_STATUSES = [...REPAIR_STEPS.slice(0, 3), 'QUOTE_REJECTED', ...REPAIR_STEPS.slice(3), 'CANCELLED', 'FAILED'];

const progressOf = (steps, bad) => (status) => {
  if (bad.has(status)) return -1;
  const i = steps.indexOf(status);
  return i < 0 ? 0 : Math.round((i / (steps.length - 1)) * 100);
};
const orderProgress = progressOf(ORDER_STEPS, ORDER_BAD);
const repairProgress = progressOf(REPAIR_STEPS, REPAIR_BAD);

const TONE = { good: 'bg-emerald-500', bad: 'bg-rose-500', info: 'bg-sky-500', warn: 'bg-amber-500', violet: 'bg-violet-500', teal: 'bg-teal-500' };
const TONES = {
  order: { DELIVERED: 'good', CANCELLED: 'bad', CONFIRMED: 'info', SHIPPED: 'violet', PROCESSING: 'teal', FINISHPROCESSING: 'teal' },
  repair: { DEVICE_DELIVERED: 'good', CANCELLED: 'bad', FAILED: 'bad', QUOTE_REJECTED: 'bad', QUOTE_APPROVED: 'good', QUOTE_SENT: 'violet', REPAIRING: 'teal', REPAIR_COMPLETED: 'teal', DEVICE_COLLECTED: 'info' },
};
const StatusBadge = memo(({ status, type = 'order', t }) => (
  <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white ${TONE[TONES[type][status]] || TONE.warn}`}>
    {t(`status_${status}`)}
  </span>
));

const SkeletonList = ({ darkMode }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {[0, 1, 2].map((i) => <div key={i} className={`h-44 animate-pulse rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />)}
  </div>
);

const TabTitle = ({ icon: Icon, children, darkMode, right }) => (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 className={`flex items-center gap-2.5 text-lg font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      <Chip3D className="h-8 w-8"><Icon className="h-4 w-4" /></Chip3D> {children}
    </h2>
    {right}
  </div>
);

/* ───────────── list filtering shared by Orders + Repairs ───────────── */
const useListView = (items, { match, price, ipp = 6 }) => {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const term = useDeferredValue(search).trim().toLowerCase();

  const filtered = useMemo(() => {
    const list = items.filter((x) => (!status || x.status === status) && (!date || dayOf(x.createdAt) === date) && (!term || match(x, term)));
    const n = (x) => Number(x[price]) || 0;
    const ts = (x) => Date.parse(x.createdAt) || 0;
    return list.sort((a, b) => (sort === 'oldest' ? ts(a) - ts(b) : sort === 'price_desc' ? n(b) - n(a) : sort === 'price_asc' ? n(a) - n(b) : ts(b) - ts(a)));
  }, [items, status, date, term, sort, match, price]);

  useEffect(() => { setPage(1); }, [status, date, term, sort]);
  const total = Math.max(1, Math.ceil(filtered.length / ipp));
  const current = Math.min(page, total);
  const pageItems = useMemo(() => filtered.slice((current - 1) * ipp, current * ipp), [filtered, current, ipp]);
  const active = !!(status || date || search || sort !== 'newest');
  const reset = useCallback(() => { setStatus(''); setDate(''); setSearch(''); setSort('newest'); }, []);
  return { status, setStatus, date, setDate, search, setSearch, sort, setSort, page: current, setPage, total, filtered, pageItems, active, reset };
};

const FilterBar = memo(({ view, statuses, t, darkMode }) => {
  const { status, setStatus, date, setDate, search, setSearch, sort, setSort, active, reset, filtered } = view;
  return (
    <div className={`${cardCls(darkMode)} mb-4 p-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex min-w-[150px] flex-1 items-center gap-2 rounded-xl border px-3 py-2 focus-within:border-emerald-500 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <FiSearch className={`h-4 w-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          <input type="search" value={search} maxLength={60} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} aria-label={t('search')}
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'}`} />
        </div>
        <Select3D darkMode={darkMode} value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('allStatuses')}>
          <option value="">{t('allStatuses')}</option>
          {statuses.map((s) => <option key={s} value={s}>{t(`status_${s}`)}</option>)}
        </Select3D>
        <Select3D darkMode={darkMode} value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('sortBy')}>
          <option value="newest">{t('newestFirst')}</option>
          <option value="oldest">{t('oldestFirst')}</option>
          <option value="price_desc">{t('highestPrice')}</option>
          <option value="price_asc">{t('lowestPrice')}</option>
        </Select3D>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className={inputCls(darkMode)} />
        {active && <Btn3D tone="soft" darkMode={darkMode} onClick={reset} className="px-3 py-2 text-xs"><FiX className="h-3.5 w-3.5" /> {t('clear')}</Btn3D>}
      </div>
      <p className={`mt-2 text-[11px] font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{filtered.length} result{filtered.length === 1 ? '' : 's'}</p>
    </div>
  );
});

/* ───────────── compact cards ───────────── */
const CardShell = ({ darkMode, index, children }) => (
  <article style={{ '--i': Math.min(index, 8) }}
    className={`anim-fade-up flex h-full flex-col gap-3 rounded-2xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 ${
      darkMode ? 'border-gray-700 bg-gray-800 hover:shadow-lg hover:shadow-black/30' : 'border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-200/70'}`}>
    {children}
  </article>
);

const Stat = ({ label, value, darkMode }) => (
  <div className={`min-w-0 rounded-xl border px-2.5 py-1.5 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
    <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
    <p className={`truncate text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
  </div>
);

const OrderCard = memo(({ order, darkMode, t, index, onDetails, onCancel }) => {
  const count = (order.orderItems || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0) || (order.orderItems || []).length;
  const canCancel = !DONE.has(order.status);
  return (
    <CardShell darkMode={darkMode} index={index}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tileCls(darkMode)}`}><Glyph3D kind="box" className="h-7 w-7" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-500">ORD #{order.id.slice(0, 6)}</p>
          {!isEmpty(order.createdAt) && <p className={`flex items-center gap-1 text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><FiCalendar className="h-3 w-3" />{fmtShort(order.createdAt)}</p>}
        </div>
        <StatusBadge status={order.status} t={t} />
      </div>
      <ProgressBar3D progress={orderProgress(order.status)} label={t(`status_${order.status}`)} darkMode={darkMode} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t('items')} value={count} darkMode={darkMode} />
        <Stat label={t('payment')} value={isEmpty(order.paymentMethod) ? '—' : order.paymentMethod.replace('_', ' ')} darkMode={darkMode} />
      </div>
      {!isEmpty(order.totalPrice) && (
        <p className={`text-xl font-black tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{order.totalPrice} <span className="text-xs font-semibold opacity-70">EGP</span></p>
      )}
      <div className={`mt-auto grid gap-2 border-t pt-3 ${canCancel ? 'grid-cols-2' : 'grid-cols-1'} ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <Btn3D tone="soft" darkMode={darkMode} onClick={() => onDetails(order)} className="py-2 text-xs"><FiInfo className="h-3.5 w-3.5" /> {t('details')}</Btn3D>
        {canCancel && <Btn3D tone="danger" onClick={() => onCancel(order.id)} className="py-2 text-xs"><FiXCircle className="h-3.5 w-3.5" /> {t('cancelOrder')}</Btn3D>}
      </div>
    </CardShell>
  );
});

const RepairCard = memo(({ req, darkMode, t, index, onDetails, onEdit, onAccept, onCancel }) => {
  const hasPrice = !isEmpty(req.price);
  const canCancel = ['SUBMITTED', 'QUOTE_SENT', 'QUOTE_APPROVED'].includes(req.status);
  return (
    <CardShell darkMode={darkMode} index={index}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tileCls(darkMode)}`}><Glyph3D kind="wrench" className="h-7 w-7" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[11px] font-bold uppercase tracking-widest text-emerald-500">REQ #{req.id.slice(0, 6)}</p>
          <p className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{req.shopName}</p>
        </div>
        <StatusBadge status={req.status} type="repair" t={t} />
      </div>
      <ProgressBar3D progress={repairProgress(req.status)} label={t(`status_${req.status}`)} darkMode={darkMode} />
      {!isEmpty(req.description) && <p className={`line-clamp-2 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{req.description}</p>}
      {hasPrice && <p className={`text-xl font-black tabular-nums ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{req.price} <span className="text-xs font-semibold opacity-70">EGP</span></p>}
      <div className={`mt-auto grid grid-cols-2 gap-2 border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <Btn3D tone="soft" darkMode={darkMode} onClick={() => onDetails(req.id)} className="py-2 text-xs"><FiInfo className="h-3.5 w-3.5" /> {t('details')}</Btn3D>
        <Btn3D tone="soft" darkMode={darkMode} onClick={() => onEdit(req)} className="py-2 text-xs"><FiEdit2 className="h-3.5 w-3.5" /> {t('edit')}</Btn3D>
        {req.status === 'QUOTE_SENT' && hasPrice && <Btn3D onClick={() => onAccept(req)} className="col-span-2 py-2 text-xs"><FiCheckCircle className="h-3.5 w-3.5" /> {t('acceptQuote')}</Btn3D>}
        {canCancel && <Btn3D tone="danger" onClick={() => onCancel(req.id)} className="col-span-2 py-2 text-xs"><FiXCircle className="h-3.5 w-3.5" /> {t('cancelRequest')}</Btn3D>}
      </div>
    </CardShell>
  );
});

/* ───────────── tabs ───────────── */
const OrdersTab = memo(({ orders, onDetails, onCancel, darkMode, t }) => {
  const match = useCallback((o, term) => o.id?.toLowerCase().includes(term), []);
  const view = useListView(orders, { match, price: 'totalPrice' });
  return (
    <>
      <TabTitle icon={FiBox} darkMode={darkMode}>{t('orders')}</TabTitle>
      <FilterBar view={view} statuses={ORDER_STATUSES} t={t} darkMode={darkMode} />
      {view.filtered.length === 0 ? (
        <EmptyState kind="box" title={t('noOrders')} subtitle={t('ordersHint')} darkMode={darkMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {view.pageItems.map((o, i) => <OrderCard key={o.id} order={o} index={i} darkMode={darkMode} t={t} onDetails={onDetails} onCancel={onCancel} />)}
          </div>
          <Pagination3D page={view.page} total={view.total} onChange={view.setPage} darkMode={darkMode} />
        </>
      )}
    </>
  );
});

const RepairsTab = memo(({ repairs, onDetails, onEdit, onAccept, onCancel, darkMode, t }) => {
  const match = useCallback((r, term) => `${r.shopName || ''} ${r.description || ''} ${r.id || ''}`.toLowerCase().includes(term), []);
  const view = useListView(repairs, { match, price: 'price' });
  return (
    <>
      <TabTitle icon={FiTool} darkMode={darkMode}>{t('repairs')}</TabTitle>
      <FilterBar view={view} statuses={REPAIR_STATUSES} t={t} darkMode={darkMode} />
      {view.filtered.length === 0 ? (
        <EmptyState kind="wrench" title={t('noRepairs')} subtitle={t('repairsHint')} darkMode={darkMode} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {view.pageItems.map((r, i) => <RepairCard key={r.id} req={r} index={i} darkMode={darkMode} t={t} onDetails={onDetails} onEdit={onEdit} onAccept={onAccept} onCancel={onCancel} />)}
          </div>
          <Pagination3D page={view.page} total={view.total} onChange={view.setPage} darkMode={darkMode} />
        </>
      )}
    </>
  );
});

const ProfileTab = memo(({ profile, form, setForm, onSave, onDelete, onLogout, language, onChangeLanguage, darkMode, t }) => {
  const [editing, setEditing] = useState(false);
  const name = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
  const submit = async (e) => { e.preventDefault(); setEditing(false); if (!(await onSave())) setEditing(true); };
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strong = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className="space-y-4">
      <TabTitle icon={FiUser} darkMode={darkMode} right={!editing && (
        <Btn3D tone="soft" darkMode={darkMode} onClick={() => setEditing(true)} className="px-3 py-2 text-xs"><FiEdit2 className="h-3.5 w-3.5 text-emerald-500" /> {t('editProfile')}</Btn3D>
      )}>{editing ? t('editProfile') : t('myProfile')}</TabTitle>

      <section className={`${cardCls(darkMode)} p-4 sm:p-5`}>
        {editing ? (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('firstName')} darkMode={darkMode}><input className={`${inputCls(darkMode)} w-full`} value={form.first_name} onChange={upd('first_name')} required /></Field>
              <Field label={t('lastName')} darkMode={darkMode}><input className={`${inputCls(darkMode)} w-full`} value={form.last_name} onChange={upd('last_name')} required /></Field>
            </div>
            <Field label={t('phoneNumber')} darkMode={darkMode}><input type="tel" className={`${inputCls(darkMode)} w-full`} value={form.phone} onChange={upd('phone')} required /></Field>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Btn3D tone="soft" darkMode={darkMode} type="button" onClick={() => setEditing(false)} className="py-2.5 text-sm">{t('cancel')}</Btn3D>
              <Btn3D type="submit" className="py-2.5 text-sm"><FiCheck className="h-4 w-4" /> {t('saveChanges')}</Btn3D>
            </div>
          </form>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <span className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${tileCls(darkMode)}`}><Glyph3D kind="user" className="h-11 w-11" /></span>
              <div className="min-w-0">
                {name && <p className={`truncate text-lg font-extrabold ${strong}`}>{name}</p>}
                {profile?.email && <p className={`truncate text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{profile.email}</p>}
              </div>
            </div>
            <div className={`grid gap-2 rounded-2xl border p-3 sm:grid-cols-2 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-100 bg-gray-50'}`}>
              {name && <InfoRow icon={FiUser} darkMode={darkMode}>{name}</InfoRow>}
              {profile?.email && <InfoRow icon={FiMail} darkMode={darkMode}>{profile.email}</InfoRow>}
              {profile?.phone && <InfoRow icon={FiPhone} darkMode={darkMode}><span dir="ltr">{profile.phone}</span></InfoRow>}
              <InfoRow icon={FiShield} darkMode={darkMode}>
                {t('accountStatus')}: <b className={profile?.activate ? 'text-emerald-500' : 'text-rose-500'}>{profile?.activate ? t('active') : t('inactive')}</b>
              </InfoRow>
            </div>
          </>
        )}
      </section>

      <section className={`${cardCls(darkMode)} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <p className={`flex items-center gap-2 text-sm font-bold ${strong}`}><FiGlobe className="h-4 w-4 text-emerald-500" /> {t('language')}</p>
        <Select3D darkMode={darkMode} value={language} onChange={(e) => onChangeLanguage(e.target.value)} aria-label={t('selectLanguage')}>
          {LANGUAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select3D>
      </section>

      <section className={`rounded-2xl border p-4 ${darkMode ? 'border-rose-500/30 bg-rose-500/5' : 'border-rose-100 bg-rose-50/60'}`}>
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-rose-500"><FiTrash2 className="h-4 w-4" /> {t('dangerZone')}</h3>
        <p className={`mt-1 mb-3 text-xs ${darkMode ? 'text-rose-300/80' : 'text-rose-600/80'}`}>{t('dangerZoneHint')}</p>
        <div className="flex flex-wrap gap-2">
          <Btn3D tone="danger" onClick={onDelete} className="px-4 py-2 text-xs"><FiTrash2 className="h-3.5 w-3.5" /> {t('deleteAccount')}</Btn3D>
          <Btn3D tone="soft" darkMode={darkMode} onClick={onLogout} className="px-4 py-2 text-xs"><RiLogoutBoxRLine className="h-3.5 w-3.5" /> {t('logout')}</Btn3D>
        </div>
      </section>
    </div>
  );
});

const EMPTY_ADDR = { state: '', city: '', street: '', building: '', notes: '', isDefault: false, latitude: 0, longitude: 0 };

const AddressesTab = memo(({ addresses, inUseIds, onCreate, onUpdate, onDelete, darkMode, t }) => {
  const [editingId, setEditingId] = useState(null); // null | 'new' | id
  const [form, setForm] = useState(EMPTY_ADDR);
  const [mode, setMode] = useState('manual');
  const formOpen = editingId !== null;
  const close = () => { setEditingId(null); setForm(EMPTY_ADDR); setMode('manual'); };
  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onMap = useCallback((lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng })), []);
  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form, latitude: form.latitude || 0, longitude: form.longitude || 0 };
    if (editingId === 'new') onCreate(payload); else onUpdate(editingId, payload);
    close();
  };
  const startEdit = (a) => {
    setForm({ state: a.state, city: a.city, street: a.street, building: a.building, notes: a.notes || '', isDefault: !!a.isDefault, latitude: a.latitude || 0, longitude: a.longitude || 0 });
    setEditingId(a.id);
  };

  if (formOpen) {
    const fields = [['state', t('stateGovernorate'), t('statePlaceholder')], ['city', t('city'), t('cityPlaceholder')], ['street', t('street'), t('streetPlaceholder')], ['building', t('buildingApartment'), t('buildingPlaceholder')]];
    return (
      <>
        <TabTitle icon={FiMapPin} darkMode={darkMode}>{editingId === 'new' ? t('addAddress') : t('editAddress')}</TabTitle>
        <form onSubmit={submit} className={`${cardCls(darkMode)} space-y-4 p-4 sm:p-5`}>
          <div className={`grid grid-cols-2 gap-1 rounded-xl p-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`} role="tablist">
            {[['manual', FiList, t('addressInformation')], ['map', FiNavigation, t('pickOnMap')]].map(([m, Icon, label]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors ${mode === m ? 'bg-emerald-500 text-white shadow-[0_2px_0_0_#047857]' : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          {mode === 'manual' ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {fields.map(([k, label, ph]) => (
                  <Field key={k} label={label} darkMode={darkMode}><input className={`${inputCls(darkMode)} w-full`} placeholder={ph} value={form[k]} onChange={upd(k)} required /></Field>
                ))}
              </div>
              <Field label={t('additionalNotes')} darkMode={darkMode}><textarea rows={3} className={`${inputCls(darkMode)} w-full resize-none`} value={form.notes} onChange={upd('notes')} /></Field>
            </div>
          ) : (
            <div className="space-y-3">
              <Suspense fallback={<div className={`h-[280px] animate-pulse rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />}>
                <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={onMap} darkMode={darkMode} />
              </Suspense>
              <div className="grid grid-cols-2 gap-3">
                {[['latitude', 'Latitude'], ['longitude', 'Longitude']].map(([k, label]) => (
                  <Field key={k} label={label} darkMode={darkMode}>
                    <input type="number" step="any" className={`${inputCls(darkMode)} w-full`} value={form[k] || ''} onChange={(e) => setForm((f) => ({ ...f, [k]: parseFloat(e.target.value) || 0 }))} />
                  </Field>
                ))}
              </div>
              <p className={`flex items-start gap-1.5 rounded-xl border p-3 text-xs ${darkMode ? 'border-sky-500/20 bg-sky-500/10 text-sky-300' : 'border-sky-100 bg-sky-50 text-sky-600'}`}><FiInfo className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{t('manualAddressHint')}</p>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
            <span className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('setDefaultAddress')}</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Btn3D tone="soft" darkMode={darkMode} type="button" onClick={close} className="py-2.5 text-sm">{t('cancel')}</Btn3D>
            <Btn3D type="submit" className="py-2.5 text-sm"><FiCheck className="h-4 w-4" /> {editingId === 'new' ? t('save') : t('update')}</Btn3D>
          </div>
        </form>
      </>
    );
  }

  return (
    <>
      <TabTitle icon={FiMapPin} darkMode={darkMode} right={<Btn3D onClick={() => setEditingId('new')} className="px-3 py-2 text-xs"><FiPlus className="h-3.5 w-3.5" /> {t('addAddress')}</Btn3D>}>{t('addresses')}</TabTitle>
      {addresses.length === 0 ? (
        <EmptyState kind="pin" title={t('noAddresses')} subtitle={t('addressHint')} darkMode={darkMode} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {addresses.map((a, i) => {
            const inUse = inUseIds.has(a.id);
            const hasCoords = !!a.latitude && !!a.longitude;
            return (
              <CardShell key={a.id} darkMode={darkMode} index={i}>
                <div className="flex items-start gap-2.5">
                  <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tileCls(darkMode)}`}><Glyph3D kind="pin" className="h-7 w-7" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{a.street}, {a.building}</h3>
                    <p className={`truncate text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{a.city}, {a.state}</p>
                  </div>
                  {a.isDefault && <span className="flex flex-shrink-0 items-center gap-1 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white"><RiVerifiedBadgeLine className="h-3 w-3" /> {t('default')}</span>}
                </div>
                {!isEmpty(a.notes) && <p className={`line-clamp-2 rounded-lg px-2.5 py-1.5 text-xs italic ${darkMode ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>“{a.notes}”</p>}
                {hasCoords && (
                  <a href={directionsUrl(a.latitude, a.longitude)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 hover:underline">
                    <FiExternalLink className="h-3 w-3" /> {t('getDirections')}
                    <span className={`ms-auto font-mono font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</span>
                  </a>
                )}
                <div className={`mt-auto border-t pt-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <Btn3D tone="soft" darkMode={darkMode} disabled={inUse} onClick={() => startEdit(a)} className="py-2 text-xs"><FiEdit2 className="h-3.5 w-3.5" /> {inUse ? t('inUse') : t('edit')}</Btn3D>
                    <Btn3D tone="danger" disabled={inUse} onClick={() => onDelete(a.id)} className="py-2 text-xs" aria-label={t('delete')}><FiTrash2 className="h-3.5 w-3.5" /> {t('delete')}</Btn3D>
                  </div>
                  {inUse && <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-500"><FiInfo className="h-3 w-3" /> {t('usedInActiveOrderRepair')}</p>}
                </div>
              </CardShell>
            );
          })}
        </div>
      )}
    </>
  );
});

const NotificationsTab = memo(({ token, darkMode, t }) => {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const ipp = 6;
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => unwrap(await api.get('/api/notifications/users', { headers: { Authorization: `Bearer ${token}` } })),
    enabled: !!token,
    refetchInterval: LIVE_POLL_MS,
  });
  const total = Math.max(1, Math.ceil(items.length / ipp));
  const current = Math.min(page, total);
  const pageItems = useMemo(() => items.slice((current - 1) * ipp, current * ipp), [items, current]);
  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const remove = useCallback(async (id) => {
    const prev = qc.getQueryData(['notifications']);
    qc.setQueryData(['notifications'], (old = []) => old.filter((n) => n.id !== id));
    try { await api.delete(`/api/notifications/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }); toast({ icon: 'success', title: 'Deleted' }); }
    catch { qc.setQueryData(['notifications'], prev); toast({ icon: 'error', title: 'Failed' }); }
  }, [qc, token]);

  return (
    <>
      <TabTitle icon={FiBell} darkMode={darkMode} right={unread > 0 && <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold text-white">{unread}</span>}>{t('notifications')}</TabTitle>
      {isLoading ? <SkeletonList darkMode={darkMode} />
        : items.length === 0 ? <EmptyState kind="bell" title={t('noNotifications')} subtitle={t('notificationHint')} darkMode={darkMode} />
          : (
            <>
              <ul className="space-y-2.5">
                {pageItems.map((n, i) => (
                  <li key={n.id} style={{ '--i': i }} className={`anim-fade-up ${cardCls(darkMode)} flex items-start gap-3 p-3.5`}>
                    <Chip3D className="h-9 w-9 flex-shrink-0"><FiBell className="h-4 w-4" /></Chip3D>
                    <div className="min-w-0 flex-1">
                      <p className={`flex items-center gap-2 text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="truncate">{n.title || n.subject || 'Notification'}</span>
                        {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" aria-label="Unread" />}
                      </p>
                      {!isEmpty(n.message || n.body) && <p className={`mt-0.5 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{n.message || n.body}</p>}
                      {!isEmpty(n.createdAt) && <p className={`mt-1 flex items-center gap-1 text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}><FiClock className="h-3 w-3" />{fmtFull(n.createdAt)}</p>}
                    </div>
                    <button type="button" onClick={() => remove(n.id)} aria-label={t('delete')}
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${darkMode ? 'text-gray-500 hover:bg-rose-500/15 hover:text-rose-400' : 'text-gray-400 hover:bg-rose-50 hover:text-rose-500'}`}><FiTrash2 className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
              <Pagination3D page={current} total={total} onChange={setPage} darkMode={darkMode} />
            </>
          )}
    </>
  );
});

const COLORS = ['#10b981', '#0d9488', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#f97316'];

const Donut = memo(({ data, darkMode, size = 144, thickness = 20 }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${total} total`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total === 0 ? <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={darkMode ? '#374151' : '#e5e7eb'} strokeWidth={thickness} />
          : data.map((d, i) => {
            const frac = d.value / total;
            const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${frac * c} ${c - frac * c}`} strokeDashoffset={-acc * c} />;
            acc += frac;
            return el;
          })}
      </g>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={darkMode ? '#fff' : '#111827'} style={{ fontSize: 24, fontWeight: 800 }}>{total}</text>
    </svg>
  );
});

const Legend = memo(({ data, darkMode }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <ul className="min-w-[150px] flex-1 space-y-1.5">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
          <span className={`flex-1 truncate font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{d.label}</span>
          <b className={darkMode ? 'text-white' : 'text-gray-900'}>{d.value}</b>
          <span className={`w-9 text-end ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{Math.round((d.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
});

const countBy = (list, label) => {
  const m = {};
  list.forEach((x) => { m[x.status] = (m[x.status] || 0) + 1; });
  return Object.entries(m).map(([k, value], i) => ({ label: label(k), value, color: COLORS[i % COLORS.length] }));
};

const AnalyticsTab = memo(({ orders, repairs, addresses, darkMode, t }) => {
  const spent = useMemo(() => orders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0) + repairs.reduce((s, r) => s + (Number(r.price) || 0), 0), [orders, repairs]);
  const orderData = useMemo(() => countBy(orders, (k) => t(`status_${k}`)), [orders, t]);
  const repairData = useMemo(() => countBy(repairs, (k) => t(`status_${k}`)), [repairs, t]);
  const n = useMemo(() => ({
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
    done: repairs.filter((r) => r.status === 'DEVICE_DELIVERED').length,
    failed: repairs.filter((r) => REPAIR_BAD.has(r.status)).length,
  }), [orders, repairs]);

  const stats = [
    { icon: FiBox, value: orders.length, label: t('totalOrders') },
    { icon: FiTool, value: repairs.length, label: t('totalRepairs') },
    { icon: FiDollarSign, value: `${spent.toFixed(0)} EGP`, label: t('totalSpent') },
    { icon: FiMapPin, value: addresses.length, label: t('savedAddresses') },
  ];
  const bars = [
    [t('ordersDelivered'), n.delivered, orders.length, '#10b981'],
    [t('ordersCancelled'), n.cancelled, orders.length, '#ef4444'],
    [t('repairsCompleted'), n.done, repairs.length, '#0d9488'],
    [t('repairsCancelledFailed'), n.failed, repairs.length, '#f59e0b'],
  ];
  const panel = `${cardCls(darkMode)} p-4 sm:p-5`;
  const h = `mb-3 flex items-center gap-2 text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`;

  return (
    <div className="space-y-4">
      <TabTitle icon={FiPieChart} darkMode={darkMode}>{t('analytics')}</TabTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className={`${cardCls(darkMode)} p-3.5`}>
            <Chip3D className="mb-2 h-8 w-8"><Icon className="h-4 w-4" /></Chip3D>
            <p className={`text-xl font-black tabular-nums ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
            <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 && repairs.length === 0 ? (
        <EmptyState kind="box" title={t('notEnoughActivity')} subtitle={t('analyticsHint')} darkMode={darkMode} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {[[FiBox, t('ordersByStatus'), orderData, orders.length, t('noOrdersYet')], [FiTool, t('repairsByStatus'), repairData, repairs.length, t('noRepairs')]].map(([Icon, title, data, count, none]) => (
              <section key={title} className={panel}>
                <h3 className={h}><Icon className="h-4 w-4 text-emerald-500" /> {title}</h3>
                {count === 0 ? <p className={`py-6 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{none}</p>
                  : <div className="flex flex-wrap items-center gap-4"><Donut data={data} darkMode={darkMode} /><Legend data={data} darkMode={darkMode} /></div>}
              </section>
            ))}
          </div>
          <section className={panel}>
            <h3 className={h}><FiTrendingUp className="h-4 w-4 text-emerald-500" /> {t('performanceOverview')}</h3>
            <div className="space-y-4">
              {bars.map(([label, value, total, color]) => {
                const pct = total ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>{value}/{total} · {pct}%</span>
                    </div>
                    <div className={`h-2 overflow-hidden rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
});

const AboutTab = memo(({ darkMode, t }) => {
  const values = [
    { icon: FiShield, title: t('verifiedShops'), text: t('verifiedShopsText') },
    { icon: FiZap, title: t('fastTurnaround'), text: t('fastTurnaroundText') },
    { icon: FiCreditCard, title: t('securePayments'), text: t('securePaymentsText') },
    { icon: FiTruck, title: t('doorstepDelivery'), text: t('doorstepDeliveryText') },
  ];
  const strong = darkMode ? 'text-white' : 'text-gray-900';
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  return (
    <div className="space-y-4">
      <TabTitle icon={FiCompass} darkMode={darkMode}>{t('aboutTechRestore')}</TabTitle>
      <section className={`${cardCls(darkMode)} flex flex-col items-center gap-4 p-5 sm:flex-row`}>
        <Scene3D className="h-28 w-40 flex-shrink-0" main="store" float="phone" extra="wrench" />
        <p className={`text-sm leading-relaxed ${muted}`}>{t('aboutDescription')}</p>
      </section>
      <section className={`${cardCls(darkMode)} p-4 sm:p-5`}>
        <h3 className={`mb-3 flex items-center gap-2 text-sm font-extrabold ${strong}`}><FiAward className="h-4 w-4 text-emerald-500" /> {t('whyChooseUs')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, text }) => (
            <div key={title} className={`flex gap-3 rounded-xl p-3 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
              <Chip3D className="h-8 w-8 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>
              <div className="min-w-0"><p className={`text-sm font-bold ${strong}`}>{title}</p><p className={`text-xs ${muted}`}>{text}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section className={`${cardCls(darkMode)} p-4 sm:p-5`}>
        <h3 className={`mb-3 flex items-center gap-2 text-sm font-extrabold ${strong}`}><FiSend className="h-4 w-4 text-emerald-500" /> {t('getInTouch')}</h3>
        <div className={`grid gap-2 rounded-2xl border p-3 sm:grid-cols-3 ${darkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-100 bg-gray-50'}`}>
          <InfoRow icon={FiMail} darkMode={darkMode}>support@tech-restore.com</InfoRow>
          <InfoRow icon={FiPhone} darkMode={darkMode}><span dir="ltr">+20 100 000 0000</span></InfoRow>
          <InfoRow icon={FiMapPin} darkMode={darkMode}>Cairo, Egypt</InfoRow>
        </div>
      </section>
    </div>
  );
});

const TipsCard = memo(({ t }) => (
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800 p-4 text-white">
    <div className="pointer-events-none absolute -end-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
    <h4 className="relative mb-2.5 flex items-center gap-2 text-sm font-extrabold"><FiTarget className="h-4 w-4" /> {t('tipsTitle')}</h4>
    <ul className="relative space-y-2">
      {['tipAddresses', 'tipQuote', 'tipInvoices', 'tipAnalytics'].map((k) => (
        <li key={k} className="flex gap-2 text-xs leading-relaxed text-emerald-50"><FiCheckCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" /><span>{t(k)}</span></li>
      ))}
    </ul>
  </div>
));

/* ───────────── modals ───────────── */
const OrderModal = memo(({ order, onClose, darkMode, t }) => {
  const strong = darkMode ? 'text-white' : 'text-gray-900';
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const items = order.orderItems || [];
  return (
    <Modal3D open onClose={onClose} darkMode={darkMode} icon={FiBox} size="sm:max-w-2xl" title={`ORD #${order.id.slice(0, 8).toUpperCase()}`}
      footer={<div className="flex justify-end"><Btn3D tone="soft" darkMode={darkMode} onClick={onClose} className="px-6 py-2 text-sm">{t('close')}</Btn3D></div>}>
      <div className="space-y-4">
        <ProgressBar3D progress={orderProgress(order.status)} label={t(`status_${order.status}`)} darkMode={darkMode} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {!isEmpty(order.createdAt) && <Stat label={t('orderDate')} value={fmtFull(order.createdAt)} darkMode={darkMode} />}
          <div className={`rounded-xl border px-2.5 py-1.5 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${muted}`}>{t('status')}</p>
            <div className="mt-0.5"><StatusBadge status={order.status} t={t} /></div>
          </div>
          {!isEmpty(order.paymentMethod) && <Stat label={t('paymentMethod')} value={order.paymentMethod.replace('_', ' ')} darkMode={darkMode} />}
        </div>
        <section>
          <h3 className={`mb-2 flex items-center gap-2 text-sm font-bold ${strong}`}><FiBox className="h-4 w-4 text-emerald-500" /> {t('orderItems')}</h3>
          <ul className={`divide-y overflow-hidden rounded-2xl border ${darkMode ? 'divide-gray-800 border-gray-700' : 'divide-gray-100 border-gray-100'}`}>
            {items.length === 0 ? <li className={`p-8 text-center text-sm ${muted}`}>{t('noItems')}</li> : items.map((it, i) => (
              <li key={i} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${strong}`}>{it.productName || '—'}</p>
                  <p className={`truncate text-xs ${muted}`}>{it.shopName || '—'} · {it.quantity} × EGP {Number(it.priceAtCheckout || 0).toFixed(2)}</p>
                </div>
                <b className="flex-shrink-0 text-sm tabular-nums text-emerald-500">EGP {(Number(it.priceAtCheckout) * Number(it.quantity)).toFixed(2)}</b>
              </li>
            ))}
            <li className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-800/60' : 'bg-gray-50'}`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${muted}`}>{t('grandTotal')}</span>
              <b className="text-lg tabular-nums text-emerald-500">EGP {order.totalPrice ?? '—'}</b>
            </li>
          </ul>
        </section>
      </div>
    </Modal3D>
  );
});

const RepairModal = memo(({ repair, onClose, darkMode, t }) => (
  <Modal3D open onClose={onClose} darkMode={darkMode} icon={FiTool} title={`#${repair.id.slice(0, 8)}`}
    footer={<div className="flex justify-end"><Btn3D tone="soft" darkMode={darkMode} onClick={onClose} className="px-6 py-2 text-sm">{t('close')}</Btn3D></div>}>
    <div className="space-y-3">
      <ProgressBar3D progress={repairProgress(repair.status)} label={t(`status_${repair.status}`)} darkMode={darkMode} />
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t('shop')} value={repair.shopName || '—'} darkMode={darkMode} />
        <div className={`rounded-xl border px-2.5 py-1.5 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
          <p className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('status')}</p>
          <div className="mt-0.5"><StatusBadge status={repair.status} type="repair" t={t} /></div>
        </div>
      </div>
      {!isEmpty(repair.description) && (
        <div className={`rounded-xl border p-3 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">Reported problem</p>
          <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{repair.description}</p>
        </div>
      )}
      {(!isEmpty(repair.paymentMethod) || !isEmpty(repair.price)) && (
        <div className={`flex items-center justify-between rounded-xl border p-3 ${darkMode ? 'border-emerald-900/60 bg-emerald-900/20' : 'border-emerald-100 bg-emerald-50/70'}`}>
          {!isEmpty(repair.paymentMethod) && <Stat label={t('paymentMethod')} value={repair.paymentMethod} darkMode={darkMode} />}
          {!isEmpty(repair.price) && <p className="text-xl font-black tabular-nums text-emerald-500">{repair.price} <span className="text-xs">EGP</span></p>}
        </div>
      )}
    </div>
  </Modal3D>
));

const EditRepairModal = memo(({ repair, categories, onClose, onSubmit, darkMode }) => {
  const [desc, setDesc] = useState(repair.description || '');
  const [cat, setCat] = useState(repair.deviceCategory?.id || repair.deviceCategory || '');
  const submit = (e) => { e.preventDefault(); onSubmit(repair, desc, cat); };
  return (
    <Modal3D open onClose={onClose} darkMode={darkMode} icon={FiEdit2} title="Edit repair" size="sm:max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Device category" darkMode={darkMode}>
          <Select3D darkMode={darkMode} className="w-full" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select3D>
        </Field>
        <Field label="Description" darkMode={darkMode}>
          <textarea rows={5} required value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Describe the issue…" className={`${inputCls(darkMode)} min-h-[100px] w-full resize-y`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Btn3D tone="soft" darkMode={darkMode} type="button" onClick={onClose} className="py-2.5 text-sm">Cancel</Btn3D>
          <Btn3D type="submit" className="py-2.5 text-sm"><FiCheck className="h-4 w-4" /> Save</Btn3D>
        </div>
      </form>
    </Modal3D>
  );
});

const ConfirmRepairModal = memo(({ req, addresses, token, onClose, onSuccess, darkMode }) => {
  const [addrId, setAddrId] = useState(() => (addresses.find((a) => a.isDefault) || addresses[0])?.id || '');
  const [delivery, setDelivery] = useState('HOME_DELIVERY');
  const [payment, setPayment] = useState('CASH');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!addrId) return;
    setBusy(true);
    try {
      const res = await api.post(`/api/users/repair-request/repairs/${req.id}/confirm`, { deliveryAddress: addrId, deliveryMethod: delivery, paymentMethod: payment }, { headers: { Authorization: `Bearer ${token}` } });
      onClose();
      if (payment === 'CREDIT_CARD' && res.data.paymentURL) {
        const S = await loadSwal();
        S.fire({ title: 'Redirecting to payment', icon: 'info', timer: 1800, showConfirmButton: false }).then(() => { window.location.href = res.data.paymentURL; });
      } else { toast({ icon: 'success', title: 'Repair confirmed!', timer: 2500 }); onSuccess(); }
    } catch (err) { toast({ icon: 'error', title: err.response?.data?.message || 'Failed to confirm repair', timer: 2500 }); }
    finally { setBusy(false); }
  };

  const opt = (active) => `rounded-xl border-2 py-2 text-xs font-bold transition-colors ${active ? 'border-emerald-500 bg-emerald-500 text-white' : darkMode ? 'border-gray-700 text-gray-300 hover:border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-500'}`;
  const lbl = `mb-1.5 flex items-center gap-1.5 text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <Modal3D open onClose={onClose} darkMode={darkMode} icon={FiCheckCircle} title="Confirm repair order" size="sm:max-w-md">
      <form onSubmit={submit} className="space-y-4">
        <div className={`rounded-xl border p-3 ${darkMode ? 'border-emerald-900/60 bg-emerald-900/20' : 'border-emerald-100 bg-emerald-50/70'}`}>
          <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{req.shopName}</p>
          {!isEmpty(req.price) && <p className="text-2xl font-black tabular-nums text-emerald-500">{req.price} <span className="text-sm font-semibold">EGP</span></p>}
        </div>
        <div>
          <p className={lbl}><FiMapPin className="h-3.5 w-3.5 text-emerald-500" /> Delivery address</p>
          {addresses.length === 0 ? <p className="text-sm font-medium text-rose-500">No addresses found. Please add one first.</p> : (
            <Select3D darkMode={darkMode} className="w-full" value={addrId} onChange={(e) => setAddrId(e.target.value)}>
              {addresses.map((a) => <option key={a.id} value={a.id}>{a.street}, {a.building} — {a.city}{a.isDefault ? ' (Default)' : ''}</option>)}
            </Select3D>
          )}
        </div>
        <div>
          <p className={lbl}><FiTruck className="h-3.5 w-3.5 text-emerald-500" /> Delivery method</p>
          <div className="grid grid-cols-3 gap-2">
            {[['HOME_DELIVERY', 'Home'], ['SHOP_VISIT', 'Visit shop'], ['PICKUP', 'Courier']].map(([v, l]) => <button key={v} type="button" onClick={() => setDelivery(v)} aria-pressed={delivery === v} className={opt(delivery === v)}>{l}</button>)}
          </div>
        </div>
        <div>
          <p className={lbl}><FiCreditCard className="h-3.5 w-3.5 text-emerald-500" /> Payment method</p>
          <div className="grid grid-cols-2 gap-2">
            {[['CASH', 'Cash'], ['CREDIT_CARD', 'Credit card']].map(([v, l]) => <button key={v} type="button" onClick={() => setPayment(v)} aria-pressed={payment === v} className={opt(payment === v)}>{l}</button>)}
          </div>
          {payment === 'CREDIT_CARD' && <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${darkMode ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-50 text-sky-600'}`}>You&apos;ll be redirected to a secure payment gateway.</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Btn3D tone="soft" darkMode={darkMode} type="button" onClick={onClose} className="py-2.5 text-sm">Cancel</Btn3D>
          <Btn3D type="submit" disabled={busy || addresses.length === 0} className="py-2.5 text-sm">{busy ? 'Processing…' : <><FiCheckCircle className="h-4 w-4" /> Confirm</>}</Btn3D>
        </div>
      </form>
    </Modal3D>
  );
});

/* ───────────── page ───────────── */
const AccountContent = ({ darkMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const language = useAppLanguage();
  const t = useCallback((k) => tr(language, k), [language]);
  const [, startTransition] = useTransition();

  const [token, setToken] = useState(() => localStorage.getItem('authToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [section, setSection] = useState('profile');
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [editingRepair, setEditingRepair] = useState(null);
  const [confirmReq, setConfirmReq] = useState(null);

  useEffect(() => { document.title = 'My Account | Tech-Restore'; }, []);

  /* auth guard */
  useEffect(() => {
    const tk = localStorage.getItem('authToken');
    let ok = false;
    try { const d = tk && jwtDecode(tk); ok = !!(d && d.exp && d.exp > Date.now() / 1000); } catch { ok = false; }
    if (!ok) { localStorage.removeItem('authToken'); setIsAuthenticated(false); navigate('/login'); }
    else { setToken(tk); setIsAuthenticated(true); }
  }, [location.pathname, navigate]);

  const cfg = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const on = !!token;

  const { data: profile, isLoading: profileLoading } = useQuery({ queryKey: ['profile'], queryFn: async () => (await api.get('/api/users/profile', cfg)).data, enabled: on });
  const { data: addresses = [], isLoading: addressesLoading } = useQuery({ queryKey: ['addresses'], queryFn: async () => unwrap(await api.get('/api/users/addresses', cfg)), enabled: on });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['orders'], queryFn: async () => unwrap(await api.get('/api/users/orders', cfg)), enabled: on, refetchInterval: LIVE_POLL_MS });
  const { data: repairs = [], isLoading: repairsLoading } = useQuery({ queryKey: ['repairs'], queryFn: async () => unwrap(await api.get('/api/users/repair-request', cfg)), enabled: on, refetchInterval: LIVE_POLL_MS });
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: async () => unwrap(await api.get('/api/notifications/users', cfg)), enabled: on, refetchInterval: LIVE_POLL_MS });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: async () => unwrap(await api.get('/api/categories', cfg)), enabled: on && !!editingRepair });

  /* keep the edit form in sync with the server profile (no side effects inside queryFn) */
  useEffect(() => {
    if (profile) setProfileForm({ first_name: profile.first_name || '', last_name: profile.last_name || '', phone: profile.phone || '' });
  }, [profile]);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const inUseIds = useMemo(() => {
    const s = new Set();
    orders.forEach((o) => { if (o.deliveryAddress && !DONE.has(o.status)) s.add(o.deliveryAddress); });
    repairs.forEach((r) => { if (r.deliveryAddress && !DONE.has(r.status)) s.add(r.deliveryAddress); });
    return s;
  }, [orders, repairs]);

  /* optimistic mutation helper: apply → request → rollback on failure */
  const mutate = useCallback(async (key, apply, request, { ok, fail }) => {
    const prev = qc.getQueryData(key);
    qc.setQueryData(key, apply);
    try { const res = await request(); toast({ icon: 'success', title: ok }); return res; }
    catch (err) { qc.setQueryData(key, prev); toast({ icon: 'error', title: err?.response?.data?.message || fail }); return null; }
  }, [qc]);

  const saveProfile = useCallback(async () => {
    const res = await mutate(['profile'], (o) => ({ ...o, ...profileForm }), () => api.put('/api/users/profile', profileForm, cfg), { ok: 'Updated!', fail: 'Update failed' });
    return !!res;
  }, [mutate, profileForm, cfg]);

  const deleteAccount = useCallback(async () => {
    const c = await ask({ title: 'Delete account?', text: 'This action is irreversible. All your data will be permanently deleted.', confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete my account' });
    if (!c.isConfirmed) return;
    try { await api.delete('/api/users/profile', cfg); localStorage.removeItem('authToken'); navigate('/'); }
    catch { toast({ icon: 'error', title: 'Failed to delete' }); }
  }, [cfg, navigate]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try { if (token && refreshToken) await api.post('/api/auth/logout', { refreshToken }); } catch { /* ignore */ }
    localStorage.clear(); qc.clear(); setToken(null); setIsAuthenticated(false);
    toast({ icon: 'success', title: 'Logged out' });
    navigate('/login', { replace: true });
  }, [token, navigate, qc]);

  const changeLanguage = useCallback((lang) => {
    if (!lang || lang === language) return;
    localStorage.setItem('appLanguage', lang);
    window.dispatchEvent(new Event('appLanguageChanged'));
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const createAddress = useCallback(async (form) => {
    const tempId = `temp-${Date.now()}`;
    const res = await mutate(['addresses'], (o = []) => [...o, { id: tempId, ...form }], () => api.post('/api/users/addresses', form, cfg), { ok: 'Added!', fail: 'Failed to add' });
    if (res?.data?.id) qc.setQueryData(['addresses'], (o = []) => o.map((a) => (a.id === tempId ? res.data : a)));
  }, [mutate, cfg, qc]);
  const updateAddress = useCallback((id, form) => mutate(['addresses'], (o = []) => o.map((a) => (a.id === id ? { ...a, ...form, id } : a)), () => api.put(`/api/users/addresses/${id}`, { ...form, id }, cfg), { ok: 'Updated!', fail: 'Failed to update' }), [mutate, cfg]);
  const deleteAddress = useCallback(async (id) => {
    const c = await ask({ title: 'Delete address?' });
    if (c.isConfirmed) mutate(['addresses'], (o = []) => o.filter((a) => a.id !== id), () => api.delete(`/api/users/addresses/${id}`, cfg), { ok: 'Deleted!', fail: 'Failed to delete' });
  }, [mutate, cfg]);

  const cancelOrder = useCallback(async (id) => {
    const c = await ask({ title: 'Cancel order?' });
    if (c.isConfirmed) mutate(['orders'], (o = []) => o.map((x) => (x.id === id ? { ...x, status: 'CANCELLED' } : x)), () => api.delete(`/api/users/orders/${id}/cancel`, cfg), { ok: 'Cancelled!', fail: 'Failed to cancel' });
  }, [mutate, cfg]);

  const viewRepair = useCallback(async (id) => {
    try { setSelectedRepair((await api.get(`/api/users/repair-request/${id}`, cfg)).data); }
    catch { toast({ icon: 'error', title: 'Failed to load' }); }
  }, [cfg]);

  const submitRepairEdit = useCallback((repair, description, deviceCategory) => {
    setEditingRepair(null);
    mutate(['repairs'], (o = []) => o.map((r) => (r.id === repair.id ? { ...r, description, deviceCategory } : r)),
      () => api.put(`/api/users/repair-request/${repair.shopId}/${repair.id}`, { description, deviceCategory }, cfg), { ok: 'Updated!', fail: 'Failed' });
  }, [mutate, cfg]);

  const acceptQuote = useCallback(async (req) => {
    const c = await ask({ icon: 'question', title: 'Accept quote?', text: `Accept ${req.price} EGP from ${req.shopName}?`, confirmButtonText: 'Yes, accept', confirmButtonColor: '#10b981' });
    if (!c.isConfirmed) return;
    const res = await mutate(['repairs'], (o = []) => o.map((r) => (r.id === req.id ? { ...r, status: 'QUOTE_APPROVED' } : r)),
      () => api.put(`/api/users/repair-request/${req.id}/status`, { status: 'QUOTE_APPROVED' }, cfg), { ok: 'Quote accepted!', fail: 'Failed to accept quote' });
    if (res) setConfirmReq(req);
  }, [mutate, cfg]);

  const cancelRepair = useCallback(async (id) => {
    const c = await ask({ title: 'Cancel request?', confirmButtonText: 'Yes, cancel', confirmButtonColor: '#ef4444' });
    if (c.isConfirmed) mutate(['repairs'], (o = []) => o.map((r) => (r.id === id ? { ...r, status: 'CANCELLED' } : r)), () => api.delete(`/api/users/repair-request/${id}/cancel`, cfg), { ok: 'Cancelled', fail: 'Failed to cancel' });
  }, [mutate, cfg]);

  const tabs = useMemo(() => [
    { id: 'profile', label: t('profile'), icon: FiUser },
    { id: 'addresses', label: t('addresses'), icon: FiMapPin, badge: addresses.length },
    { id: 'orders', label: t('orders'), icon: FiBox, badge: orders.length },
    { id: 'repairs', label: t('repairs'), icon: FiTool, badge: repairs.length },
    { id: 'notifications', label: t('notifications'), icon: FiBell, badge: unread },
    { id: 'analytics', label: t('analytics'), icon: FiPieChart },
    { id: 'about', label: t('aboutUs'), icon: FiCompass },
  ], [t, addresses.length, orders.length, repairs.length, unread]);

  const loading = { profile: profileLoading, addresses: addressesLoading, orders: ordersLoading, repairs: repairsLoading }[section];
  const go = useCallback((id) => startTransition(() => setSection(id)), []);
  const name = profile?.first_name;

  const tabBtn = (tab, vertical) => {
    const active = section === tab.id;
    return (
      <button key={tab.id} type="button" onClick={() => go(tab.id)} aria-current={active ? 'page' : undefined}
        className={`flex flex-shrink-0 items-center gap-2.5 rounded-xl text-sm font-bold transition-all duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${vertical ? 'w-full px-3 py-2.5' : 'whitespace-nowrap px-3.5 py-2 text-xs'} ${
          active ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_3px_0_0_#047857]'
            : darkMode ? 'text-gray-300 hover:bg-emerald-500/10 hover:text-emerald-300' : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'}`}>
        <tab.icon className={`h-4 w-4 flex-shrink-0 ${active ? '' : 'text-emerald-500'}`} />
        <span className={vertical ? 'flex-1 text-start' : ''}>{tab.label}</span>
        {!!tab.badge && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${active ? 'bg-white/25 text-white' : darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>{tab.badge}</span>}
      </button>
    );
  };

  let content;
  if (loading) content = <SkeletonList darkMode={darkMode} />;
  else if (section === 'profile') content = <ProfileTab profile={profile} form={profileForm} setForm={setProfileForm} onSave={saveProfile} onDelete={deleteAccount} onLogout={logout} language={language} onChangeLanguage={changeLanguage} darkMode={darkMode} t={t} />;
  else if (section === 'addresses') content = <AddressesTab addresses={addresses} inUseIds={inUseIds} onCreate={createAddress} onUpdate={updateAddress} onDelete={deleteAddress} darkMode={darkMode} t={t} />;
  else if (section === 'orders') content = <OrdersTab orders={orders} onDetails={setSelectedOrder} onCancel={cancelOrder} darkMode={darkMode} t={t} />;
  else if (section === 'repairs') content = <RepairsTab repairs={repairs} onDetails={viewRepair} onEdit={setEditingRepair} onAccept={acceptQuote} onCancel={cancelRepair} darkMode={darkMode} t={t} />;
  else if (section === 'notifications') content = <NotificationsTab token={token} darkMode={darkMode} t={t} />;
  else if (section === 'analytics') content = <AnalyticsTab orders={orders} repairs={repairs} addresses={addresses} darkMode={darkMode} t={t} />;
  else content = <AboutTab darkMode={darkMode} t={t} />;

  return (
    <div dir={languageDirection(language)} className={`min-h-screen ${language === 'ar' ? 'font-cairo' : 'font-poppins'} ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <style>{UI3D_CSS}</style>
      <Defs3D />

      <Suspense fallback={<div className={`h-[260px] w-full animate-pulse sm:h-[320px] ${darkMode ? 'bg-gray-900' : 'bg-emerald-50'}`} />}>
        <Hero variant="account" darkMode={darkMode} />
      </Suspense>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-start gap-6 lg:gap-8">
          {/* sidebar */}
          <aside className={`${cardCls(darkMode)} sticky top-20 hidden max-h-[calc(100vh-6rem)] w-64 flex-shrink-0 flex-col gap-3 self-start overflow-y-auto p-3 lg:flex xl:w-72`}>
            <div className={`flex items-center gap-3 rounded-xl p-3 ${tileCls(darkMode)}`}>
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-white/10' : 'bg-white'}`}><Glyph3D kind="user" className="h-8 w-8" /></span>
              <div className="min-w-0 flex-1">
                {name && <p className={`truncate text-sm font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name} {profile?.last_name}</p>}
                {profile?.email && <p className={`truncate text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{profile.email}</p>}
              </div>
              {isAuthenticated && (
                <button type="button" onClick={logout} title={t('logout')} aria-label={t('logout')}
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${darkMode ? 'text-gray-400 hover:bg-rose-500/15 hover:text-rose-400' : 'text-gray-500 hover:bg-white hover:text-rose-500'}`}><RiLogoutBoxRLine className="h-4 w-4" /></button>
              )}
            </div>
            <nav className="flex flex-col gap-1" aria-label="Account sections">{tabs.map((tab) => tabBtn(tab, true))}</nav>
            <TipsCard t={t} />
          </aside>

          <main className="min-w-0 flex-1">
            <div className={`${cardCls(darkMode)} mb-4 flex items-center justify-between gap-4 overflow-hidden p-4`}>
              <div className="min-w-0">
                <h1 className={`truncate text-xl font-extrabold sm:text-2xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('welcomeBack')}{name ? `, ${name}` : ''}</h1>
                <p className={`mt-0.5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t('manageAccount')}</p>
              </div>
              <Scene3D compact className="hidden h-20 w-28 sm:block" main="store" float="phone" />
            </div>

            <nav className="hide-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden" aria-label="Account sections">{tabs.map((tab) => tabBtn(tab, false))}</nav>

            <div key={section} className="anim-fade-up">{content}</div>

            <div className="mt-6 lg:hidden"><TipsCard t={t} /></div>
          </main>
        </div>
      </div>

      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} darkMode={darkMode} t={t} />}
      {selectedRepair && <RepairModal repair={selectedRepair} onClose={() => setSelectedRepair(null)} darkMode={darkMode} t={t} />}
      {editingRepair && <EditRepairModal key={editingRepair.id} repair={editingRepair} categories={categories} onClose={() => setEditingRepair(null)} onSubmit={submitRepairEdit} darkMode={darkMode} />}
      {confirmReq && <ConfirmRepairModal key={confirmReq.id} req={confirmReq} addresses={addresses} token={token} onClose={() => setConfirmReq(null)} onSuccess={() => qc.invalidateQueries({ queryKey: ['repairs'] })} darkMode={darkMode} />}
    </div>
  );
};

AccountContent.displayName = 'AccountContent';

export default function Account(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AccountContent {...props} />
    </QueryClientProvider>
  );
}