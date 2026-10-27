import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import {
  FiCopy, FiInfo, FiMapPin, FiPhone, FiClock, FiShoppingBag, FiClipboard,
  FiUserCheck, FiTruck, FiXCircle, FiPackage,
} from 'react-icons/fi';
import api from '../common/api/api';
import {
  PageShell, PageHeader, StatCard, Toolbar, Tabs, SortTh, Th, PageBar, Pill, EmptyState, ErrorState,
  CardSkeleton, SkeletonRows, Route, CustomerBox, InfoRow, AgentPicker, NotesField, DrawerShell, IdSubtitle,
  useI18n, useLatest, useDarkMode, useMediaQuery, useAuth, ensureFonts, notify,
  asList, toItem, normAgent, sortAgents, reconcile, errText, isSafeId, sanitizeNotes, shortId, cap, pct,
  nextSort, validDate, statusLabel, TONE_BG, BTN_ICON, BTN_LG,
} from '../components/assigner/AssignerKit';

export const ORDERS_REASSIGN_CONFIG = {
  kind: 'order',
  icon: FiPackage,
  eyebrowKey: 'eyebrow.reassign',
  titleKey: 'orders.reassign.title',
  subtitleKey: 'orders.reassign.subtitle',
  docTitleKey: 'orders.reassign.doc',
  pendingUrl: '/api/assigner/orders-for-assignment',
  reassignUrl: '/api/assigner/reassign-order',
  logType: 'ORDER',
  logIdField: 'orderId',
  priceField: 'totalPrice',
  priceLabelKey: 'price.order',
  valueLabelKey: 'value.total',
};

const LAYOUT_DEFAULTS = {
  rowsOptions: [6, 12, 24, 48],
  defaultRows: 6,
  defaultView: 'cards',
  stopKeys: { pickup: 'stop.pickupShop', dropoff: 'stop.dropCustomer' },
};

const TABLE_MQ = '(min-width: 1280px)';
const GRID_CLS = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';
const COLS = 8;
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const TABS = [
  { key: 'all', tk: 'tab.all' },
  { key: 'progress', tk: 'tab.progress' },
  { key: 'unassigned', tk: 'tab.unassigned' },
];
const SORT_KEY = { id: 'id', user: 'user', route: 'shop', amount: 'amount', date: 'date', agent: 'agent', status: 'status' };
const STATUS_TONE = {
  PENDING: 'am', SUBMITTED: 'am', QUOTE_PENDING: 'am', PENDING_PICKUP: 'am', ASSIGNED: 'em',
  IN_TRANSIT: 'bl', IN_PROGRESS: 'bl', SHIPPED: 'bl', COMPLETED: 'em', CANCELLED: 'rd',
};
const isStrong = (item) => !!item.deliveryId && item.status !== 'CANCELLED';

const QueueCard = memo(({ item, noun, labels, agentName, onOpen, onCopy }) => {
  const { t, f } = useI18n();
  const assigned = !!item.deliveryId;
  const strong = isStrong(item);
  const canMove = item.status !== 'COMPLETED';
  const sid = shortId(item.id);
  return (
    <li className="min-w-0">
      <article className={`nb-card h-full flex flex-col gap-4 p-4 ${strong ? 'nb-tint' : ''}`}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button type="button" onClick={() => onCopy(item.id)} aria-label={t('copy.aria', { item: noun, id: sid })} className="nb-btn h-8 px-3 text-xs">
              #{sid} <FiCopy size={12} aria-hidden="true" />
            </button>
            <p className="nb-muted mt-2 text-xs font-bold">{f.short(item.createdAt)}</p>
          </div>
          <p className="text-base font-extrabold whitespace-nowrap tabular-nums">{f.price(item.amount)}</p>
        </header>

        <CustomerBox item={item} />
        <Route item={item} labels={labels} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill tone={STATUS_TONE[item.status] || 'gr'}>{statusLabel(t, item.status)}</Pill>
          <span className={`inline-flex items-center gap-1.5 min-w-0 text-xs font-extrabold ${assigned ? '' : 'nb-muted'}`}>
            <FiTruck size={12} className="flex-shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[150px]">{assigned ? agentName : t('agent.none')}</span>
          </span>
        </div>

        <div className={`mt-auto grid gap-3 pt-1 ${canMove ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <button type="button" onClick={() => onOpen(item)} aria-label={t('details.aria', { item: noun, id: sid })} className={BTN_LG}>
            {t('details')}
          </button>
          {canMove && (
            <button type="button" onClick={() => onOpen(item)} aria-label={t(assigned ? 'reassign.aria' : 'assign.aria', { item: noun, id: sid })} className={`${BTN_LG} nb-btn-a`}>
              {t(assigned ? 'reassign' : 'assign')}
            </button>
          )}
        </div>
      </article>
    </li>
  );
});

const Row = memo(({ item, noun, agentName, onOpen, onCopy }) => {
  const { t, f } = useI18n();
  const name = item.userName || t('customer.unknown');
  const assigned = !!item.deliveryId;
  const strong = isStrong(item);
  const canMove = item.status !== 'COMPLETED';
  const created = validDate(item.createdAt);
  const sid = shortId(item.id);
  return (
    <tr className={strong ? 'nb-row-on' : ''}>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          <code className="text-[11px] font-mono font-bold">#{sid}</code>
          <button type="button" title={t('copy.title')} aria-label={t('copy.short', { item: noun })} onClick={() => onCopy(item.id)} className="nb-muted hover:text-[var(--nb-accent)] transition-colors">
            <FiCopy size={12} aria-hidden="true" />
          </button>
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="nb-tile w-9 h-9 text-sm font-extrabold uppercase" style={{ background: TONE_BG.em }}>{name.charAt(0)}</span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase truncate max-w-[170px]">{name}</p>
            <p dir="ltr" className="nb-muted text-[10px] font-semibold truncate max-w-[170px] text-start">{item.userPhone || t('phone.noneShort')}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <FiShoppingBag size={12} className="nb-ic flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[150px]">{item.shopName || '—'}</span>
        </p>
        <p className="nb-muted flex items-center gap-1.5 text-[11px] font-semibold mt-0.5">
          <FiMapPin size={12} className="flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[150px]">{item.userAddr.city || '—'}</span>
        </p>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap text-xs font-extrabold tabular-nums">{f.price(item.amount)}</td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="leading-tight">
          <p className="text-xs font-extrabold">{created ? f.day(created) : '—'}</p>
          <p className="nb-muted text-[10px] font-mono">{created ? f.clock(created) : ''}</p>
        </div>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${assigned ? '' : 'nb-muted'}`}>
          <FiTruck size={12} className="flex-shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[130px]">{assigned ? agentName : '—'}</span>
        </span>
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><Pill tone={STATUS_TONE[item.status] || 'gr'}>{statusLabel(t, item.status)}</Pill></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button type="button" title={t('details')} aria-label={t('details.aria', { item: noun, id: sid })} onClick={() => onOpen(item)} className={BTN_ICON}>
            <FiInfo size={14} aria-hidden="true" />
          </button>
          {canMove && (
            <button type="button" onClick={() => onOpen(item)} aria-label={t(assigned ? 'reassign.aria' : 'assign.aria', { item: noun, id: sid })} className="nb-btn nb-btn-a h-8 px-3 text-xs uppercase">
              <FiUserCheck size={13} aria-hidden="true" /> {t(assigned ? 'reassign' : 'assign')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

const Drawer = ({ cfg, item, currentName, candidates, notes, onNotes, picked, onPick, busy, onClose, onSubmit, onCopy, labels }) => {
  const { t, f } = useI18n();
  const assigned = !!item.deliveryId;
  const canMove = item.status !== 'COMPLETED';
  const noun = t(`${cfg.kind}.one`);
  const title = canMove ? t(assigned ? 'drawer.reassign' : 'drawer.assign', { item: noun }) : t('drawer.details', { Item: cap(noun), item: noun });
  const pickedAgent = candidates.find((a) => a.id === picked);
  const firstName = pickedAgent ? pickedAgent.name.split(' ')[0] || t('drawer.agentWord') : '';

  const footer = (
    <>
      <button type="button" onClick={onClose} disabled={busy} className={`${BTN_LG} flex-1`}>
        {canMove ? t('drawer.cancel') : t('drawer.close')}
      </button>
      {canMove && (
        <button type="button" onClick={onSubmit} disabled={busy || !picked} className={`${BTN_LG} nb-btn-a flex-[1.6]`}>
          <FiUserCheck size={16} aria-hidden="true" />
          {busy ? t('drawer.saving') : pickedAgent ? t(assigned ? 'drawer.transferTo' : 'drawer.assignTo', { name: firstName }) : t('drawer.pick')}
        </button>
      )}
    </>
  );

  return (
    <DrawerShell title={title} busy={busy} onClose={onClose} footer={footer} subtitle={<IdSubtitle id={item.id} onCopy={onCopy} />}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="nb-muted text-xs font-bold">{t(cfg.priceLabelKey)}</p>
          <p className="text-2xl font-extrabold tabular-nums">{f.price(item.amount)}</p>
        </div>
        <Pill tone={STATUS_TONE[item.status] || 'gr'}>{statusLabel(t, item.status)}</Pill>
      </div>
      <CustomerBox item={item} />
      <Route item={item} labels={labels} />
      <div className="space-y-2.5">
        <InfoRow icon={FiTruck} label={t('drawer.currentAgent')} value={currentName || (assigned ? `#${shortId(item.deliveryId)}` : t('drawer.notAssigned'))} />
        <InfoRow icon={FiClock} label={t('drawer.recordedOn')} value={f.full(item.createdAt)} />
        {item.shopPhone && <InfoRow icon={FiPhone} label={t('drawer.shopPhone')} value={item.shopPhone} ltr />}
        {item.assignerName && <InfoRow icon={FiUserCheck} label={t('drawer.assignedBy')} value={item.assignerName} />}
      </div>

      {canMove && (
        <>
          <NotesField id="reassign-notes" label={t('drawer.notes.reassign')} value={notes} onChange={onNotes} />
          <AgentPicker agents={candidates} picked={picked} onPick={onPick} busy={busy} title={t('drawer.chooseNew')} emptyKey="drawer.noOther" />
        </>
      )}
    </DrawerShell>
  );
};

export const ReassignQueue = memo(({ config = ORDERS_REASSIGN_CONFIG }) => {
  const cfg = useMemo(() => ({ ...LAYOUT_DEFAULTS, ...config }), [config]);
  const cfgRef = useLatest(cfg);
  const ctx = useI18n();
  const ctxRef = useLatest(ctx);
  const { t, f } = ctx;
  const darkMode = useDarkMode();
  const isTable = useMediaQuery(TABLE_MQ);
  const { tokenRef, denied, logout, forbid } = useAuth();

  const [items, setItems] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [view, setView] = useState(cfg.defaultView);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(cfg.defaultRows);
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [drawerId, setDrawerId] = useState(null);
  const [notes, setNotes] = useState('');
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);

  const abortRef = useRef(null);
  const busyRef = useRef(false);
  const term = useDeferredValue(search).trim().toLowerCase();

  const noun = t(`${cfg.kind}.one`);
  const nouns = t(`${cfg.kind}.many`);
  const labels = useMemo(() => ({ pickup: t(cfg.stopKeys.pickup), dropoff: t(cfg.stopKeys.dropoff) }), [t, cfg.stopKeys]);

  useEffect(() => { document.title = t(cfg.docTitleKey); }, [t, cfg.docTitleKey]);
  useEffect(() => { ensureFonts(); }, []);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (denied) return;
    const c = cfgRef.current;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    if (!silent) setLoading(true);
    setError(false);
    const req = { headers: { Authorization: `Bearer ${tokenRef.current}` }, signal: ctrl.signal };
    try {
      const [pendingRes, logRes, agentsRes] = await Promise.allSettled([
        api.get(c.pendingUrl, req),
        api.get('/api/assigner/assignment-log', { ...req, params: { assignmentType: c.logType } }),
        api.get('/api/assigner/delivery-persons', req),
      ]);
      if (ctrl.signal.aborted) return;

      const statuses = [pendingRes, logRes, agentsRes].map((r) => (r.status === 'rejected' ? r.reason?.response?.status : null));
      if (statuses.includes(401)) { logout(); return; }
      if (statuses.includes(403)) { forbid(); return; }
      if (pendingRes.status === 'rejected' && logRes.status === 'rejected') throw logRes.reason;
      if (!silent && (pendingRes.status === 'rejected' || logRes.status === 'rejected')) {
        notify('warning', ctxRef.current.t('toast.partial', { items: ctxRef.current.t(`${c.kind}.many`) }));
      }

      const map = new Map();
      if (pendingRes.status === 'fulfilled') {
        asList(pendingRes.value).forEach((o) => {
          if (o?.id == null) return;
          map.set(o.id, toItem(o, c.priceField, o.id, false, 'PENDING'));
        });
      }
      if (logRes.status === 'fulfilled') {
        asList(logRes.value).forEach((l) => {
          const id = l[c.logIdField] || l.id;
          if (!id) return;
          map.set(id, toItem(l, c.priceField, id, true, 'ASSIGNED'));
        });
      }

      setItems((prev) => reconcile(prev, Array.from(map.values())));
      if (agentsRes.status === 'fulfilled') setAgents((prev) => reconcile(prev, asList(agentsRes.value).map(normAgent)));
      else if (!silent) notify('warning', ctxRef.current.t('toast.agentsDown.reassign'));
      setLastUpdated(new Date());
    } catch (err) {
      if (ctrl.signal.aborted || err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
      if (!silent) {
        setError(true);
        notify('error', ctxRef.current.t('toast.loadFail', { items: ctxRef.current.t(`${c.kind}.many`) }), errText(err));
      }
    } finally {
      if (abortRef.current === ctrl) setLoading(false);
    }
  }, [denied, logout, forbid, tokenRef, cfgRef, ctxRef]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const handleCopy = useCallback(async (id) => {
    const { t: tr } = ctxRef.current;
    try {
      await navigator.clipboard.writeText(String(id));
      notify('success', tr('copied'));
    } catch {
      notify('error', tr('copyFail.title'), tr('copyFail'));
    }
  }, [ctxRef]);

  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);

  const index = useMemo(() => items.map((it) => {
    const user = it.userName.toLowerCase();
    const shop = it.shopName.toLowerCase();
    const id = String(it.id ?? '').toLowerCase();
    const agent = (agentById.get(it.deliveryId)?.name || '').toLowerCase();
    return {
      it, user, shop, id, agent,
      status: it.status,
      amount: it.amount,
      date: it.ts,
      asg: it.deliveryId ? 1 : 0,
      text: `${id} ${user} ${shop} ${it.status.toLowerCase().replace(/_/g, ' ')} ${agent} ${it.userPhone.toLowerCase()}`,
    };
  }), [items, agentById]);

  const stats = useMemo(() => {
    let progress = 0; let value = 0;
    for (const i of items) { if (i.deliveryId) progress += 1; value += i.amount; }
    return { all: items.length, progress, unassigned: items.length - progress, value };
  }, [items]);
  const counts = useMemo(() => ({ all: stats.all, progress: stats.progress, unassigned: stats.unassigned }), [stats]);

  const filtered = useMemo(() => {
    const key = SORT_KEY[sort.field] || 'date';
    const dir = sort.dir === 'asc' ? 1 : -1;
    const list = index.filter((e) => (
      (tab === 'all' || (tab === 'progress' ? e.asg === 1 : e.asg === 0))
      && (!term || e.text.includes(term))
    ));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list.map((e) => e.it);
  }, [index, tab, term, sort]);

  useEffect(() => { setCurrentPage(1); }, [tab, term, rowsPerPage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);

  const statCards = useMemo(() => [
    { label: t('stat.total', { items: nouns }), value: f.num(stats.all), description: t('stat.total.log'), icon: cfg.icon || FiPackage, tone: 'em', percent: stats.all ? 100 : 0, color: TONE_BG.em },
    { label: t('stat.progress'), value: f.num(stats.progress), description: t('stat.progress.desc'), icon: FiTruck, tone: 'teal', percent: pct(stats.progress, stats.all), color: TONE_BG.teal },
    { label: t('stat.unassigned'), value: f.num(stats.unassigned), description: t('stat.unassigned.desc'), icon: FiXCircle, tone: 'lime', percent: pct(stats.unassigned, stats.all), color: TONE_BG.lime },
    { label: t(cfg.valueLabelKey), value: f.price(stats.value), description: t('stat.valueDesc', { items: nouns }), icon: FiClipboard, tone: 'cyan' },
  ], [stats, cfg, t, f, nouns]);

  const resetDrawerState = useCallback(() => { setNotes(''); setPicked(null); }, []);
  const closeDrawer = useCallback(() => { setDrawerId(null); resetDrawerState(); }, [resetDrawerState]);
  const openItem = useCallback((item) => { resetDrawerState(); setDrawerId(item.id); }, [resetDrawerState]);

  const drawerItem = useMemo(() => (drawerId ? items.find((i) => i.id === drawerId) || null : null), [drawerId, items]);
  useEffect(() => { if (drawerId && !drawerItem) closeDrawer(); }, [drawerId, drawerItem, closeDrawer]);

  const candidates = useMemo(
    () => sortAgents(agents.filter((a) => !drawerItem || a.id !== drawerItem.deliveryId)),
    [agents, drawerItem]
  );
  const currentName = drawerItem?.deliveryId ? agentById.get(drawerItem.deliveryId)?.name || '' : '';

  const submitReassign = useCallback(async () => {
    if (busyRef.current || !drawerItem || !picked || !isSafeId(picked) || !isSafeId(drawerItem.id)) return;
    const { t: tr } = ctxRef.current;
    const c = cfgRef.current;
    const target = agentById.get(picked);
    if (target && !target.available) {
      notify('warning', tr('toast.agentOffline'));
      return;
    }
    const nounOne = tr(`${c.kind}.one`);
    busyRef.current = true;
    setBusy(true);
    const { id } = drawerItem;
    const oldId = drawerItem.deliveryId;
    try {
      await api.put(`${c.reassignUrl}/${encodeURIComponent(id)}`, {
        newDeliveryId: picked,
        notes: sanitizeNotes(notes).trim(),
      }, { headers: { Authorization: `Bearer ${tokenRef.current}` } });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, deliveryId: picked, status: i.status === 'PENDING' ? 'ASSIGNED' : i.status } : i)));
      setAgents((prev) => prev.map((a) => {
        if (a.id === picked) return { ...a, active: a.active + 1 };
        if (oldId && a.id === oldId) return { ...a, active: Math.max(0, a.active - 1) };
        return a;
      }));
      notify('success', tr('toast.transferred', { Item: cap(nounOne), item: nounOne }));
      closeDrawer();
      fetchData({ silent: true });
    } catch (err) {
      const s = err?.response?.status;
      if (s === 401) { logout(); return; }
      notify('error', s === 404 ? tr('toast.notFound', { Item: cap(nounOne), item: nounOne }) : tr('toast.reassign.fail'), errText(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [drawerItem, picked, notes, agentById, closeDrawer, fetchData, logout, tokenRef, cfgRef, ctxRef]);

  const handleSort = useCallback((field) => setSort((s) => nextSort(s, field, field === 'date' ? 'desc' : 'asc')), []);
  const refresh = useCallback(() => fetchData(), [fetchData]);
  const clearSearch = useCallback(() => setSearch(''), []);
  const handleRows = useCallback((v) => setRowsPerPage(Number(v)), []);
  const goToPage = useCallback((p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  }, []);

  if (denied) return null;

  const showTable = isTable && view === 'table';
  const isLoading = loading && items.length === 0 && !error;
  let stateNode = null;
  if (!isLoading) {
    if (error && items.length === 0) {
      stateNode = <ErrorState title={t('err.title', { items: nouns })} subtitle={t('err.sub')} retryLabel={t('err.retry')} onRetry={refresh} />;
    } else if (items.length === 0) {
      stateNode = <EmptyState darkMode={darkMode} title={t('empty.none.title', { items: nouns })} subtitle={t('empty.none.msg', { items: nouns })} actionLabel={t('empty.none.action')} onAction={refresh} />;
    } else if (filtered.length === 0) {
      stateNode = <EmptyState darkMode={darkMode} title={t('empty.match.title', { items: nouns })} subtitle={t('empty.match.reassign')} actionLabel={search ? t('empty.match.action') : undefined} onAction={clearSearch} />;
    }
  }

  return (
    <PageShell darkMode={darkMode}>
      <PageHeader
        eyebrow={t(cfg.eyebrowKey)}
        title={t(cfg.titleKey)}
        subtitle={t(cfg.subtitleKey)}
        lastUpdated={lastUpdated}
        loading={loading}
        onRefresh={refresh}
        refreshLabel={t('refresh')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((s) => <StatCard key={s.tone} {...s} />)}
      </div>

      <section className="nb-card overflow-hidden">
        <Toolbar
          id="queue-search"
          search={search}
          onSearch={setSearch}
          placeholder={t('search.reassign')}
          label={t('search.label', { items: nouns })}
          rows={rowsPerPage}
          rowsOptions={cfg.rowsOptions}
          onRows={handleRows}
          rowsLabel={t('perPage', { items: cap(nouns) })}
          showViews={isTable}
          view={view}
          onView={setView}
        />
        <Tabs tabs={TABS} value={tab} counts={counts} onChange={setTab} />

        {showTable && (
          <>
            <div className="overflow-auto max-h-[68vh] slim-scroll">
              <table className="w-full min-w-[1020px] text-start border-collapse">
                <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                  <tr>
                    <SortTh label={t('col.id')} field="id" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.customer')} field="user" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.route')} field="route" sort={sort} onSort={handleSort} />
                    <SortTh label={t(cfg.priceLabelKey)} field="amount" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.date')} field="date" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.agent')} field="agent" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.status')} field="status" sort={sort} onSort={handleSort} />
                    <Th>{t('col.actions')}</Th>
                  </tr>
                </thead>
                <tbody className="nb-rows">
                  {isLoading ? (
                    <SkeletonRows count={Math.min(rowsPerPage, 8)} cols={COLS} />
                  ) : stateNode ? (
                    <tr><td colSpan={COLS} className="px-6 py-14 text-center">{stateNode}</td></tr>
                  ) : (
                    paginated.map((i) => (
                      <Row
                        key={i.id}
                        item={i}
                        noun={noun}
                        agentName={i.deliveryId ? agentById.get(i.deliveryId)?.name || `#${shortId(i.deliveryId)}` : ''}
                        onOpen={openItem}
                        onCopy={handleCopy}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && !isLoading && (
              <PageBar page={page} totalPages={totalPages} total={filtered.length} perPage={rowsPerPage} items={nouns} onChange={goToPage} />
            )}
          </>
        )}
      </section>

      {!showTable && (
        isLoading ? (
          <ul className={GRID_CLS} aria-busy="true" aria-label={t('loading', { items: nouns })}>
            {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
          </ul>
        ) : stateNode ? (
          <div className="nb-card px-6 py-12">{stateNode}</div>
        ) : (
          <>
            <ul className={GRID_CLS}>
              {paginated.map((i) => (
                <QueueCard
                  key={i.id}
                  item={i}
                  noun={noun}
                  labels={labels}
                  agentName={i.deliveryId ? agentById.get(i.deliveryId)?.name || `#${shortId(i.deliveryId)}` : ''}
                  onOpen={openItem}
                  onCopy={handleCopy}
                />
              ))}
            </ul>
            <PageBar boxed page={page} totalPages={totalPages} total={filtered.length} perPage={rowsPerPage} items={nouns} onChange={goToPage} />
          </>
        )
      )}

      {drawerItem && (
        <Drawer
          cfg={cfg}
          item={drawerItem}
          currentName={currentName}
          candidates={candidates}
          notes={notes}
          onNotes={setNotes}
          picked={picked}
          onPick={setPicked}
          busy={busy}
          onClose={closeDrawer}
          onSubmit={submitReassign}
          onCopy={handleCopy}
          labels={labels}
        />
      )}
    </PageShell>
  );
});

const ReassignOrders = () => <ReassignQueue config={ORDERS_REASSIGN_CONFIG} />;

export default memo(ReassignOrders);