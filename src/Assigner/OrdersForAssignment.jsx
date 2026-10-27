import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import {
  FiCopy, FiInfo, FiMapPin, FiPhone, FiClock, FiShoppingBag, FiClipboard,
  FiCheck, FiUserCheck, FiUsers, FiPackage,
} from 'react-icons/fi';
import api from '../common/api/api';
import {
  PageShell, PageHeader, StatCard, Toolbar, Tabs, SortTh, Th, SelectAll, PageBar, Pill, EmptyState, ErrorState,
  CardSkeleton, SkeletonRows, Route, CustomerBox, InfoRow, AgentPicker, NotesField, DrawerShell, IdSubtitle,
  useI18n, useLatest, useDarkMode, useMediaQuery, useNow, useAuth, ensureFonts, notify, confirmAction,
  asList, toItem, normAgent, sortAgents, reconcile, errText, isSafeId, sanitizeNotes, shortId, cap, pct,
  nextSort, validDate, waitLabel, waitTone, TONE_BG, BTN_MD, BTN_ICON, BTN_LG,
} from '../components/assigner/AssignerKit';

export const ORDERS_CONFIG = {
  kind: 'order',
  icon: FiPackage,
  eyebrowKey: 'eyebrow.dispatch',
  titleKey: 'orders.assign.title',
  subtitleKey: 'orders.assign.subtitle',
  docTitleKey: 'orders.assign.doc',
  pendingUrl: '/api/assigner/orders-for-assignment',
  assignUrl: '/api/assigner/assign-order',
  assignKey: 'orderId',
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

const POLL_MS = 60_000;
const TABLE_MQ = '(min-width: 1280px)';
const GRID_CLS = 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3';
const COLS = 8;
const REDUCED = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const TABS = [
  { key: 'all', tk: 'tab.all' },
  { key: 'pending', tk: 'tab.pending' },
  { key: 'assigned', tk: 'tab.assigned' },
];
const SORT_KEY = { id: 'id', user: 'user', route: 'shop', amount: 'amount', waiting: 'date', status: 'asg' };

const QueueCard = memo(({ item, noun, labels, selected, now, onToggle, onOpen, onCopy }) => {
  const ctx = useI18n();
  const { t, f } = ctx;
  const assigned = !!item.deliveryId;
  const sid = shortId(item.id);
  return (
    <li className="min-w-0">
      <article className={`nb-card h-full flex flex-col gap-4 p-4 ${assigned ? 'nb-tint' : ''} ${selected ? 'nb-sel' : ''}`}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {!assigned && (
                <input type="checkbox" className="nb-check" checked={selected} onChange={() => onToggle(item.id)} aria-label={t('select.item', { item: noun, id: sid })} />
              )}
              <button type="button" onClick={() => onCopy(item.id)} aria-label={t('copy.aria', { item: noun, id: sid })} className="nb-btn h-8 px-3 text-xs">
                #{sid} <FiCopy size={12} aria-hidden="true" />
              </button>
            </div>
            <p className="nb-muted mt-2 text-xs font-bold">{f.short(item.createdAt)}</p>
          </div>
          <p className="text-base font-extrabold whitespace-nowrap tabular-nums">{f.price(item.amount)}</p>
        </header>

        <CustomerBox item={item} />
        <Route item={item} labels={labels} />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Pill tone={assigned ? 'em' : 'am'}>{t(assigned ? 'st.ASSIGNED' : 'st.PENDING')}</Pill>
          {!assigned && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${waitTone(item.createdAt, now)}`}>
              <FiClock size={12} aria-hidden="true" /> {t('waiting', { time: waitLabel(ctx, item.createdAt, now) })}
            </span>
          )}
        </div>

        <div className={`mt-auto grid gap-3 pt-1 ${assigned ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <button type="button" onClick={() => onOpen(item)} aria-label={t('details.aria', { item: noun, id: sid })} className={BTN_LG}>
            {t('details')}
          </button>
          {!assigned && (
            <button type="button" onClick={() => onOpen(item)} aria-label={t('assign.aria', { item: noun, id: sid })} className={`${BTN_LG} nb-btn-a`}>
              {t('assign')}
            </button>
          )}
        </div>
      </article>
    </li>
  );
});

const Row = memo(({ item, noun, selected, now, onToggle, onOpen, onCopy }) => {
  const ctx = useI18n();
  const { t, f } = ctx;
  const name = item.userName || t('customer.unknown');
  const assigned = !!item.deliveryId;
  const created = validDate(item.createdAt);
  const sid = shortId(item.id);
  return (
    <tr className={assigned ? 'nb-row-on' : selected ? 'nb-row-sel' : ''}>
      <td className="w-10 ps-4 pe-1 py-2.5">
        {!assigned && (
          <input type="checkbox" className="nb-check" checked={selected} onChange={() => onToggle(item.id)} aria-label={t('select.item', { item: noun, id: sid })} />
        )}
      </td>
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
        {assigned ? (
          <span className="nb-muted text-xs font-bold">{created ? f.day(created) : '—'}</span>
        ) : (
          <div className="leading-tight">
            <p className={`text-xs font-extrabold ${waitTone(item.createdAt, now)}`}>{waitLabel(ctx, item.createdAt, now)}</p>
            <p className="nb-muted text-[10px] font-mono">{created ? `${f.day(created)} ${f.clock(created)}` : '—'}</p>
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap"><Pill tone={assigned ? 'em' : 'am'}>{t(assigned ? 'st.ASSIGNED' : 'st.PENDING')}</Pill></td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button type="button" title={t('details')} aria-label={t('details.aria', { item: noun, id: sid })} onClick={() => onOpen(item)} className={BTN_ICON}>
            <FiInfo size={14} aria-hidden="true" />
          </button>
          {!assigned && (
            <button type="button" onClick={() => onOpen(item)} aria-label={t('assign.aria', { item: noun, id: sid })} className="nb-btn nb-btn-a h-8 px-3 text-xs uppercase">
              <FiUserCheck size={13} aria-hidden="true" /> {t('assign')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

const Drawer = ({ cfg, mode, item, targets, agents, notes, onNotes, picked, onPick, busy, onClose, onSubmit, onCopy, labels }) => {
  const { t, f } = useI18n();
  const bulk = mode === 'bulk';
  const assigned = !bulk && !!item?.deliveryId;
  const count = bulk ? targets.length : 1;
  const total = useMemo(() => (bulk ? targets.reduce((s, x) => s + x.amount, 0) : item?.amount || 0), [bulk, targets, item]);
  const noun = t(`${cfg.kind}.one`);
  const nouns = t(`${cfg.kind}.many`);
  const nounFor = count === 1 ? noun : nouns;
  const title = bulk
    ? t('drawer.bulk', { count: f.num(count), items: nounFor })
    : assigned ? t('drawer.details', { Item: cap(noun), item: noun }) : t('drawer.assign', { item: noun });
  const pickedAgent = agents.find((a) => a.id === picked);
  const firstName = pickedAgent ? pickedAgent.name.split(' ')[0] || t('drawer.agentWord') : '';

  const footer = (
    <>
      <button type="button" onClick={onClose} disabled={busy} className={`${BTN_LG} flex-1`}>
        {assigned ? t('drawer.close') : t('drawer.cancel')}
      </button>
      {!assigned && (
        <button type="button" onClick={onSubmit} disabled={busy || !picked || count === 0} className={`${BTN_LG} nb-btn-a flex-[1.6]`}>
          <FiUserCheck size={16} aria-hidden="true" />
          {busy ? t('drawer.assigning') : pickedAgent ? t('drawer.assignTo', { name: firstName }) : t('drawer.pick')}
        </button>
      )}
    </>
  );

  return (
    <DrawerShell
      title={title}
      busy={busy}
      onClose={onClose}
      footer={footer}
      subtitle={!bulk && item ? <IdSubtitle id={item.id} onCopy={onCopy} /> : null}
    >
      {bulk ? (
        <div className="nb-soft nb-tint p-4">
          <p className="text-sm font-extrabold">{t('drawer.bulkSel', { count: f.num(count), items: nounFor })}</p>
          <p className="nb-muted text-xs font-semibold mt-0.5">
            {t('drawer.bulkSum', { label: t(cfg.priceLabelKey), price: f.price(total) })}
          </p>
        </div>
      ) : item && (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="nb-muted text-xs font-bold">{t(cfg.priceLabelKey)}</p>
              <p className="text-2xl font-extrabold tabular-nums">{f.price(item.amount)}</p>
            </div>
            <Pill tone={assigned ? 'em' : 'am'}>{t(assigned ? 'st.ASSIGNED' : 'st.PENDING')}</Pill>
          </div>
          <CustomerBox item={item} />
          <Route item={item} labels={labels} />
          <div className="space-y-2.5">
            <InfoRow icon={FiClock} label={t('drawer.receivedOn')} value={f.full(item.createdAt)} />
            {item.shopPhone && <InfoRow icon={FiPhone} label={t('drawer.shopPhone')} value={item.shopPhone} ltr />}
            {item.assignerName && <InfoRow icon={FiUserCheck} label={t('drawer.assignedBy')} value={item.assignerName} />}
          </div>
        </>
      )}

      {!assigned && (
        <>
          <NotesField id="assign-notes" label={t('drawer.notes.assign')} value={notes} onChange={onNotes} />
          <AgentPicker agents={agents} picked={picked} onPick={onPick} busy={busy} title={t('drawer.choose')} emptyKey="drawer.noAgents" />
        </>
      )}
    </DrawerShell>
  );
};

const AssignmentQueue = ({ config = ORDERS_CONFIG }) => {
  const cfg = useMemo(() => ({ ...LAYOUT_DEFAULTS, ...config }), [config]);
  const cfgRef = useLatest(cfg);
  const ctx = useI18n();
  const ctxRef = useLatest(ctx);
  const { t, f } = ctx;
  const darkMode = useDarkMode();
  const isTable = useMediaQuery(TABLE_MQ);
  const now = useNow();
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
  const [sort, setSort] = useState({ field: 'waiting', dir: 'asc' });
  const [selected, setSelected] = useState(() => new Set());
  const [drawer, setDrawer] = useState(null);
  const [notes, setNotes] = useState('');
  const [picked, setPicked] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const abortRef = useRef(null);
  const assigningRef = useRef(false);
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
        api.get('/api/assigner/assignment-log', req),
        api.get('/api/assigner/delivery-persons', req),
      ]);
      if (ctrl.signal.aborted) return;

      const statuses = [pendingRes, logRes, agentsRes].map((r) => (r.status === 'rejected' ? r.reason?.response?.status : null));
      if (statuses.includes(401)) { logout(); return; }
      if (statuses.includes(403)) { forbid(); return; }
      if (pendingRes.status === 'rejected') throw pendingRes.reason;

      const map = new Map();
      asList(pendingRes.value).forEach((o) => {
        if (o?.id == null) return;
        map.set(o.id, toItem(o, c.priceField, o.id, false, 'PENDING'));
      });
      if (logRes.status === 'fulfilled') {
        asList(logRes.value).forEach((l) => {
          if (l.assignmentType !== c.logType) return;
          const id = l[c.logIdField];
          if (!id) return;
          const base = toItem(l, c.priceField, id, true, 'ASSIGNED');
          const ex = map.get(id);
          map.set(id, ex ? { ...ex, status: base.status, deliveryId: base.deliveryId, userName: base.userName || ex.userName } : base);
        });
      }

      const list = Array.from(map.values());
      setItems((prev) => reconcile(prev, list));
      const stillPending = new Set(list.filter((i) => !i.deliveryId).map((i) => i.id));
      setSelected((prev) => {
        const next = new Set([...prev].filter((id) => stillPending.has(id)));
        return next.size === prev.size ? prev : next;
      });
      if (agentsRes.status === 'fulfilled') setAgents((prev) => reconcile(prev, asList(agentsRes.value).map(normAgent)));
      else if (!silent) notify('warning', ctxRef.current.t('toast.agentsDown.assign'));
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

  useEffect(() => {
    if (denied) return undefined;
    const id = setInterval(() => {
      if (!document.hidden && !assigningRef.current) fetchData({ silent: true });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [denied, fetchData]);

  const handleCopy = useCallback(async (id) => {
    const { t: tr } = ctxRef.current;
    try {
      await navigator.clipboard.writeText(String(id));
      notify('success', tr('copied'));
    } catch {
      notify('error', tr('copyFail.title'), tr('copyFail'));
    }
  }, [ctxRef]);

  const index = useMemo(() => items.map((it) => {
    const user = it.userName.toLowerCase();
    const shop = it.shopName.toLowerCase();
    const id = String(it.id ?? '').toLowerCase();
    return {
      it, user, shop, id,
      amount: it.amount,
      date: it.ts,
      asg: it.deliveryId ? 1 : 0,
      text: `${id} ${user} ${shop} ${it.userPhone.toLowerCase()} ${it.userAddr.city.toLowerCase()} ${it.status.toLowerCase()}`,
    };
  }), [items]);

  const stats = useMemo(() => {
    let assigned = 0; let value = 0;
    for (const i of items) { if (i.deliveryId) assigned += 1; value += i.amount; }
    return { all: items.length, assigned, pending: items.length - assigned, value };
  }, [items]);
  const counts = useMemo(() => ({ all: stats.all, pending: stats.pending, assigned: stats.assigned }), [stats]);

  const filtered = useMemo(() => {
    const key = SORT_KEY[sort.field] || 'date';
    const dir = sort.dir === 'asc' ? 1 : -1;
    const list = index.filter((e) => (
      (tab === 'all' || (tab === 'assigned' ? e.asg === 1 : e.asg === 0))
      && (!term || e.text.includes(term))
    ));
    list.sort((a, b) => (a[key] < b[key] ? -dir : a[key] > b[key] ? dir : 0));
    return list.map((e) => e.it);
  }, [index, tab, term, sort]);

  useEffect(() => { setCurrentPage(1); }, [tab, term, rowsPerPage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);

  const sortedAgents = useMemo(() => sortAgents(agents), [agents]);
  const agentById = useMemo(() => new Map(agents.map((a) => [a.id, a])), [agents]);

  const statCards = useMemo(() => [
    { label: t('stat.total', { items: nouns }), value: f.num(stats.all), description: t('stat.total.queue'), icon: cfg.icon || FiPackage, tone: 'em', percent: stats.all ? 100 : 0, color: TONE_BG.em },
    { label: t('stat.pending'), value: f.num(stats.pending), description: t('stat.pending.desc'), icon: FiUserCheck, tone: 'teal', percent: pct(stats.pending, stats.all), color: TONE_BG.teal },
    { label: t('stat.assigned'), value: f.num(stats.assigned), description: t('stat.assigned.desc'), icon: FiCheck, tone: 'lime', percent: pct(stats.assigned, stats.all), color: TONE_BG.lime },
    { label: t(cfg.valueLabelKey), value: f.price(stats.value), description: t('stat.valueDesc', { items: nouns }), icon: FiClipboard, tone: 'cyan' },
  ], [stats, cfg, t, f, nouns]);

  const pagePending = useMemo(() => paginated.filter((i) => !i.deliveryId), [paginated]);
  const allOnPage = pagePending.length > 0 && pagePending.every((i) => selected.has(i.id));
  const someOnPage = pagePending.some((i) => selected.has(i.id));

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const all = pagePending.every((i) => next.has(i.id));
      pagePending.forEach((i) => (all ? next.delete(i.id) : next.add(i.id)));
      return next;
    });
  }, [pagePending]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const bulkTargets = useMemo(() => items.filter((i) => selected.has(i.id) && !i.deliveryId), [items, selected]);
  const selectedValue = useMemo(() => bulkTargets.reduce((s, x) => s + x.amount, 0), [bulkTargets]);

  const resetDrawerState = useCallback(() => { setNotes(''); setPicked(null); }, []);
  const closeDrawer = useCallback(() => { setDrawer(null); resetDrawerState(); }, [resetDrawerState]);
  const openItem = useCallback((item) => { resetDrawerState(); setDrawer({ mode: 'single', id: item.id }); }, [resetDrawerState]);
  const openBulk = useCallback(() => { resetDrawerState(); setDrawer({ mode: 'bulk' }); }, [resetDrawerState]);

  const drawerItem = useMemo(
    () => (drawer?.mode === 'single' ? items.find((i) => i.id === drawer.id) || null : null),
    [drawer, items]
  );
  useEffect(() => {
    if (drawer?.mode === 'single' && !drawerItem) closeDrawer();
    if (drawer?.mode === 'bulk' && bulkTargets.length === 0) closeDrawer();
  }, [drawer, drawerItem, bulkTargets.length, closeDrawer]);

  const submitAssign = useCallback(async () => {
    if (assigningRef.current || !picked || !isSafeId(picked)) return;
    const { t: tr, f: fm } = ctxRef.current;
    const c = cfgRef.current;
    const agent = agentById.get(picked);
    if (agent && !agent.available) {
      notify('warning', tr('toast.agentOffline'));
      return;
    }
    const nounOne = tr(`${c.kind}.one`);
    const nounMany = tr(`${c.kind}.many`);
    const targets = drawer?.mode === 'bulk' ? bulkTargets : drawerItem ? [drawerItem] : [];
    const todo = targets.filter((x) => !x.deliveryId && isSafeId(x.id));
    if (!todo.length) return;

    if (todo.length > 1) {
      const ok = await confirmAction({
        title: tr('confirm.title', { count: fm.num(todo.length), items: nounMany }),
        text: tr('confirm.text', { agent: agent?.name || tr('confirm.thisAgent') }),
        confirmText: tr('confirm.ok'),
        cancelText: tr('confirm.cancel'),
      });
      if (!ok) return;
    }

    assigningRef.current = true;
    setIsAssigning(true);
    const note = sanitizeNotes(notes).trim();
    const done = new Set();
    let lastErr = null;
    for (const x of todo) {
      try {
        await api.post(c.assignUrl, { [c.assignKey]: x.id, deliveryId: picked, notes: note }, {
          headers: { Authorization: `Bearer ${tokenRef.current}` },
        });
        done.add(x.id);
      } catch (err) {
        lastErr = err;
        const s = err?.response?.status;
        if (s === 401 || s === 403) break;
      }
    }

    if (done.size) {
      setItems((prev) => prev.map((i) => (done.has(i.id) ? { ...i, deliveryId: picked, status: 'ASSIGNED' } : i)));
      setAgents((prev) => prev.map((a) => (a.id === picked ? { ...a, active: a.active + done.size } : a)));
      setSelected((prev) => { const next = new Set(prev); done.forEach((id) => next.delete(id)); return next; });
    }
    const failed = todo.length - done.size;
    if (!failed) {
      notify('success', todo.length > 1
        ? tr('toast.assigned.many', { count: fm.num(done.size), items: nounMany })
        : tr('toast.assigned.one', { Item: cap(nounOne), item: nounOne }));
    } else if (done.size) notify('warning', tr('toast.assigned.partial', { done: fm.num(done.size), failed: fm.num(failed) }));
    else notify('error', tr('toast.assigned.fail'), errText(lastErr));

    assigningRef.current = false;
    setIsAssigning(false);
    if (lastErr?.response?.status === 401) { logout(); return; }
    if (done.size) { closeDrawer(); fetchData({ silent: true }); }
  }, [picked, drawer, bulkTargets, drawerItem, agentById, notes, closeDrawer, fetchData, logout, tokenRef, cfgRef, ctxRef]);

  const handleSort = useCallback((field) => setSort((s) => nextSort(s, field, 'asc')), []);
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
      stateNode = <EmptyState darkMode={darkMode} title={t('empty.queue.title')} subtitle={t('empty.queue.msg', { items: nouns })} actionLabel={t('empty.queue.action')} onAction={refresh} />;
    } else if (filtered.length === 0) {
      stateNode = <EmptyState darkMode={darkMode} title={t('empty.match.title', { items: nouns })} subtitle={t('empty.match.assign')} actionLabel={search ? t('empty.match.action') : undefined} onAction={clearSearch} />;
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
          placeholder={t('search.assign')}
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
              <table className="w-full min-w-[1040px] text-start border-collapse">
                <thead className="nb-gray sticky top-0 z-10 shadow-[0_2px_0_0_var(--nb-line)]">
                  <tr>
                    <th scope="col" className="w-10 ps-4 pe-1 py-3">
                      <SelectAll checked={allOnPage} indeterminate={!allOnPage && someOnPage} disabled={pagePending.length === 0} onChange={toggleAllOnPage} label={t('select.all')} />
                    </th>
                    <SortTh label={t('col.id')} field="id" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.customer')} field="user" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.route')} field="route" sort={sort} onSort={handleSort} />
                    <SortTh label={t(cfg.priceLabelKey)} field="amount" sort={sort} onSort={handleSort} />
                    <SortTh label={t('col.waiting')} field="waiting" sort={sort} onSort={handleSort} />
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
                      <Row key={i.id} item={i} noun={noun} selected={selected.has(i.id)} now={i.deliveryId ? 0 : now} onToggle={toggleSelect} onOpen={openItem} onCopy={handleCopy} />
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

      {selected.size > 0 && (
        <div role="status" className="nb-card nb-tint flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-bold">
            {t('selection.selected', { count: f.num(bulkTargets.length), items: bulkTargets.length === 1 ? noun : nouns })}
            <span className="nb-muted"> · {f.price(selectedValue)}</span>
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={clearSelection} className={`${BTN_MD} h-9 uppercase`}>{t('selection.clear')}</button>
            <button type="button" onClick={openBulk} disabled={bulkTargets.length === 0} className={`${BTN_MD} nb-btn-a h-9 uppercase`}>
              <FiUsers size={14} aria-hidden="true" /> {t('selection.assign')}
            </button>
          </div>
        </div>
      )}

      {!showTable && (
        isLoading ? (
          <ul className={GRID_CLS} aria-busy="true" aria-label={t('loading', { items: nouns })}>
            {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
          </ul>
        ) : stateNode ? (
          <div className="nb-card px-6 py-12">{stateNode}</div>
        ) : (
          <>
            {pagePending.length > 0 && (
              <label className="nb-card flex w-fit items-center gap-2.5 px-4 py-2 text-xs font-extrabold uppercase cursor-pointer">
                <SelectAll checked={allOnPage} indeterminate={!allOnPage && someOnPage} disabled={false} onChange={toggleAllOnPage} label={t('select.all')} />
                {t('select.all')}
              </label>
            )}
            <ul className={GRID_CLS}>
              {paginated.map((i) => (
                <QueueCard
                  key={i.id}
                  item={i}
                  noun={noun}
                  labels={labels}
                  selected={selected.has(i.id)}
                  now={i.deliveryId ? 0 : now}
                  onToggle={toggleSelect}
                  onOpen={openItem}
                  onCopy={handleCopy}
                />
              ))}
            </ul>
            <PageBar boxed page={page} totalPages={totalPages} total={filtered.length} perPage={rowsPerPage} items={nouns} onChange={goToPage} />
          </>
        )
      )}

      {drawer && (drawer.mode === 'bulk' || drawerItem) && (
        <Drawer
          cfg={cfg}
          mode={drawer.mode}
          item={drawerItem}
          targets={bulkTargets}
          agents={sortedAgents}
          notes={notes}
          onNotes={setNotes}
          picked={picked}
          onPick={setPicked}
          busy={isAssigning}
          onClose={closeDrawer}
          onSubmit={submitAssign}
          onCopy={handleCopy}
          labels={labels}
        />
      )}
    </PageShell>
  );
};

export default memo(AssignmentQueue);