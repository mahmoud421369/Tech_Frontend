import React, {
  useState, useEffect, useCallback, useMemo, useRef, useDeferredValue, memo,
} from 'react';
import {
  FiSearch, FiFilter, FiDownload, FiRefreshCw, FiCopy, FiHash,
  FiDollarSign, FiCreditCard, FiTool, FiShoppingCart, FiCheckCircle,
} from 'react-icons/fi';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';
import {
  POLL_MS, SEARCH_MAX, SPAN_MS, BTN, BTN_MD, CARD, TH, SCROLL_CSS,
  toTs, fmt, num, formatPrice, tpl, renderTpl, sanitizeSearch, shortId, errText, upper,
  csvCell, useDarkMode, useShopLocale, StatCard, RowsDropdown, SortTh, Pagination, FilterPanel,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';

ensureShopAssets();

const INK = '#04261a';
const TYPE_META = {
  ORDER_PAYMENT: { icon: FiShoppingCart, hex: '#38bdf8', ink: INK },
  REPAIR_PAYMENT: { icon: FiTool, hex: '#fbbf24', ink: INK },
};
const FALLBACK_TYPE = { icon: FiDollarSign, hex: '#9ca3af', ink: INK };
const TABS = ['all', 'ORDER_PAYMENT', 'REPAIR_PAYMENT'];
const METHOD_KEYS = ['CASH', 'CARD', 'ONLINE'];
const SORT_KEYS = ['newest', 'oldest', 'highest', 'lowest'];
const RANGE_KEYS = ['all', 'today', 'week', 'month'];
const SKELETON_COLS = [0, 1, 2, 3, 4];

const SORTERS = {
  newest: (a, b) => b.ts - a.ts,
  oldest: (a, b) => a.ts - b.ts,
  highest: (a, b) => b.price - a.price,
  lowest: (a, b) => a.price - b.price,
};

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const HEAD_CLS = 'sticky top-0 z-10 nb-gray shadow-[0_2px_0_0_var(--nb-line)]';

const normMethod = (m) => { const v = upper(m); return v === 'CREDIT_CARD' ? 'CARD' : v; };
const pick = (reported, fallback) => (reported != null && Number.isFinite(Number(reported)) ? Number(reported) : fallback);

const TabBtn = memo(({ k, active, label, count, onSelect }) => {
  const click = useCallback(() => onSelect(k), [onSelect, k]);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={click}
      className={`${BTN} flex-shrink-0 px-3 py-2 text-xs uppercase rtl:tracking-normal ${active ? 'nb-btn-on' : ''}`}
    >
      {label}
      <span className="nb-chip !px-1.5" style={active ? undefined : { background: 'var(--nb-gray)' }}>{count}</span>
    </button>
  );
});

const TxnRow = memo(({ txn, loc, onCopy }) => {
  const { L, fm } = loc;
  const t = L.transactions;
  const meta = TYPE_META[txn.type] || FALLBACK_TYPE;
  const TypeIcon = meta.icon;
  const MethodIcon = txn.method === 'CASH' ? FiDollarSign : FiCreditCard;
  const copy = useCallback(() => onCopy(txn.reference), [onCopy, txn.reference]);
  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-3">
        <p className="text-xs font-extrabold">{fmt(fm.date, txn.paidAt)}</p>
        <p className="nb-muted text-[10px] font-semibold">{fmt(fm.time, txn.paidAt)}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className="nb-chip !normal-case" style={{ background: meta.hex, color: meta.ink }}>
          <TypeIcon size={12} aria-hidden="true" /> {t.types[txn.type] || txn.type || '—'}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold">
          <MethodIcon size={12} className="nb-ic" aria-hidden="true" />
          {t.method[txn.method] || txn.method || '—'}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <div className="flex items-center gap-1.5">
          <FiHash size={12} className="nb-muted" aria-hidden="true" />
          <span dir="ltr" className="text-[11px] font-bold tabular-nums">{txn.reference}</span>
          <button type="button" title={t.copyAria} aria-label={t.copyAria} onClick={copy} className="nb-muted hover:text-[color:var(--nb-accent)]"><FiCopy size={11} /></button>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-[13px] font-extrabold tabular-nums">
        {formatPrice(txn.amount, L.table.price, fm.number)}
      </td>
    </tr>
  );
});

const Transactions = () => {
  const darkMode = useDarkMode();
  const loc = useShopLocale();
  const { language, L, fm, dir, font } = loc;
  const t = L.transactions;
  const tt = L.table;
  const nf = fm.number;

  const [rows, setRows] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const abortRef = useRef(null);
  const locRef = useRef(loc);
  useEffect(() => { locRef.current = loc; }, [loc]);
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const term = useDeferredValue(search).trim().toLowerCase();

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    if (!silent) setLoading(true);

    const list = (res, kind) => (res.status === 'fulfilled'
      ? (Array.isArray(res.value.data) ? res.value.data : res.value.data?.content || [])
        .map((x, i) => ({ ...x, paymentType: x.paymentType || kind, _kind: kind, _key: `${kind}-${x.id ?? x.paymentReference ?? i}` }))
      : null);

    const [rep, rep2, ord] = await Promise.allSettled([
      api.get('/api/shops/payments/financial-report', { signal }),
      api.get('/api/shops/payments/repairs', { signal }),
      api.get('/api/shops/payments/orders', { signal }),
    ]);
    if (signal.aborted) return;

    const repairs = list(rep2, 'REPAIR_PAYMENT');
    const orders = list(ord, 'ORDER_PAYMENT');
    if (rep.status === 'fulfilled') setReport(rep.value.data);
    if (repairs || orders) {
      setRows((prev) => [
        ...(repairs ?? prev.filter((x) => x._kind === 'REPAIR_PAYMENT')),
        ...(orders ?? prev.filter((x) => x._kind === 'ORDER_PAYMENT')),
      ]);
      setLastUpdated(new Date());
    }
    if (!silent && (!repairs || !orders)) {
      const failed = [rep2, ord].find((r) => r.status === 'rejected');
      toast({ icon: 'error', title: locRef.current.L.transactions.toasts.partialFail, text: errText(failed?.reason) });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => { if (!document.hidden) fetchAll({ silent: true }); }, POLL_MS);
    return () => { clearInterval(iv); abortRef.current?.abort(); };
  }, [fetchAll]);

  const index = useMemo(() => rows.map((r) => {
    const type = upper(r.paymentType);
    const method = normMethod(r.paymentMethod);
    const reference = String(r.paymentReference || shortId(r.id) || '—');
    return {
      txn: { key: r._key, paidAt: r.paidAt, type, method, reference, amount: num(r.amount) },
      ts: toTs(r.paidAt),
      price: num(r.amount),
      text: [reference, r.details, t.types[type], t.method[method]].filter(Boolean).join(' ').toLowerCase(),
    };
  }), [rows, t.types, t.method]);

  const counts = useMemo(() => {
    const c = { all: index.length };
    for (const { txn } of index) c[txn.type] = (c[txn.type] || 0) + 1;
    return c;
  }, [index]);

  const stats = useMemo(() => {
    let total = 0; let repair = 0; let order = 0;
    for (const { txn } of index) {
      total += txn.amount;
      if (txn.type === 'REPAIR_PAYMENT') repair += txn.amount;
      else if (txn.type === 'ORDER_PAYMENT') order += txn.amount;
    }
    return {
      total: pick(report?.totalEarnings, total),
      repair: pick(report?.repairEarnings, repair),
      order: pick(report?.salesEarnings, order),
    };
  }, [report, index]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const span = SPAN_MS[dateRange];
    const list = index.filter(({ txn, ts, text }) => (
      (typeFilter === 'all' || txn.type === typeFilter)
      && (methodFilter === 'all' || txn.method === methodFilter)
      && (!span || now - ts <= span)
      && (!term || text.includes(term))
    ));
    list.sort(SORTERS[sortBy] || SORTERS.newest);
    return list.map((e) => e.txn);
  }, [index, typeFilter, methodFilter, dateRange, term, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [typeFilter, methodFilter, dateRange, term, sortBy, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const skeletonRows = useMemo(() => Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => i), [rowsPerPage]);

  const statCards = useMemo(() => [
    { label: t.stats.total.label, value: formatPrice(stats.total, tt.price, nf), description: t.stats.total.desc, icon: FiDollarSign, tone: 'em' },
    { label: t.stats.repair.label, value: formatPrice(stats.repair, tt.price, nf), description: t.stats.repair.desc, icon: FiTool, tone: 'am' },
    { label: t.stats.sales.label, value: formatPrice(stats.order, tt.price, nf), description: t.stats.sales.desc, icon: FiShoppingCart, tone: 'sky' },
    { label: t.stats.done.label, value: nf.format(counts.all), description: t.stats.done.desc, icon: FiCheckCircle, tone: 'vi' },
  ], [stats, counts.all, t, tt, nf]);

  const handleCopy = useCallback(async (value) => {
    const x = locRef.current.L.transactions.toasts;
    try {
      await navigator.clipboard.writeText(String(value));
      toast({ icon: 'success', title: x.copied, text: x.copiedText, timer: 2000 });
    } catch {
      toast({ icon: 'error', title: x.copyFail, text: x.copyFailText });
    }
  }, []);

  const exportToCSV = useCallback(() => {
    const { L: LL, fm: ff } = locRef.current;
    const x = LL.transactions;
    if (!filtered.length) { toast({ icon: 'info', title: x.toasts.noData }); return; }
    const header = [x.csv.date, x.csv.type, x.csv.method, x.csv.ref, x.csv.amount];
    const body = filtered.map((r) => [
      csvCell(fmt(ff.date, r.paidAt)),
      csvCell(x.types[r.type] || r.type),
      csvCell(x.method[r.method] || r.method),
      csvCell(r.reference),
      num(r.amount),
    ].join(','));
    const csv = `\uFEFF${[header.map(csvCell).join(','), ...body].join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.rel = 'noopener';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [filtered]);

  const resetFilters = useCallback(() => { setMethodFilter('all'); setDateRange('all'); setSortBy('newest'); }, []);
  const closeFilter = useCallback(() => setShowFilterPanel(false), []);
  const openFilter = useCallback(() => setShowFilterPanel(true), []);
  const refresh = useCallback(() => fetchAll(), [fetchAll]);
  const handleSearch = useCallback((e) => setSearch(sanitizeSearch(e.target.value)), []);
  const toggleDateSort = useCallback(() => setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest')), []);
  const toggleAmountSort = useCallback(() => setSortBy((s) => (s === 'highest' ? 'lowest' : 'highest')), []);

  const filterGroups = useMemo(() => [
    [t.groups.sort, SORT_KEYS.map((k) => ({ value: k, label: t.sort[k] })), sortBy, setSortBy],
    [t.groups.method, [{ value: 'all', label: t.methodAll }, ...METHOD_KEYS.map((k) => ({ value: k, label: t.method[k] }))], methodFilter, setMethodFilter],
    [t.groups.range, RANGE_KEYS.map((k) => ({ value: k, label: t.ranges[k] })), dateRange, setDateRange],
  ], [t, sortBy, methodFilter, dateRange]);

  const activeFilterCount = (methodFilter !== 'all') + (dateRange !== 'all') + (sortBy !== 'newest');
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  return (
    <div
      dir={dir}
      lang={language}
      style={font}
      className="nb-page min-h-screen py-6 lg:ps-64 mt-16 text-start"
    >
      <style>{PAGE_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />

      <div key={language} className="lang-fade mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="nb-bar" aria-hidden="true" />
            <h1 className="mt-2 text-2xl font-extrabold leading-[1.15] tracking-tight rtl:tracking-normal sm:text-3xl">
              <span className="nb-ul">{t.title[0]}{t.title[1]}</span>
            </h1>
            <p className="nb-muted mt-2 text-xs font-semibold">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2.5">
            {lastUpdated && (
              <p className="nb-chip hidden !normal-case sm:inline-flex" role="status" aria-live="polite">
                {tpl(tt.lastUpdated, { t: fmt(fm.time, lastUpdated) })}
              </p>
            )}
            <button type="button" onClick={refresh} aria-label={tt.refresh} title={tt.refresh} className={`${BTN_MD} h-10 uppercase rtl:tracking-normal`}>
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> {tt.refresh}
            </button>
            <button type="button" onClick={exportToCSV} className={`${BTN_MD} h-10 uppercase rtl:tracking-normal`}>
              <FiDownload size={14} aria-hidden="true" /> {t.export}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <section className={`${CARD} min-w-0 overflow-hidden`}>
          <div className="nb-gray nb-line flex flex-wrap items-center gap-2.5 border-b-2 p-3 sm:p-4">
            <div className="relative min-w-[220px] flex-1">
              <FiSearch className="nb-muted pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2" size={16} aria-hidden="true" />
              <input
                type="search"
                value={search}
                maxLength={SEARCH_MAX}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-label={t.searchAria}
                placeholder={t.searchPlaceholder}
                onChange={handleSearch}
                className="nb-input h-10 w-full ps-10 pe-3 text-sm font-semibold"
              />
            </div>
            <RowsDropdown value={rowsPerPage} onChange={setRowsPerPage} label={tt.rows} formatNumber={nf.format} />
            <button type="button" onClick={openFilter} className={`${BTN_MD} relative h-10 uppercase rtl:tracking-normal`}>
              <FiFilter size={14} aria-hidden="true" /> {tt.filter}
              {activeFilterCount > 0 && (
                <span className="nb-chip absolute -end-2 -top-2.5 !px-1.5" style={{ background: 'var(--nb-accent)', color: INK }}>{nf.format(activeFilterCount)}</span>
              )}
            </button>
          </div>

          <div role="tablist" aria-label={t.tabsAria} className="slim-scroll nb-line flex gap-2 overflow-x-auto border-b-2 p-3">
            {TABS.map((s) => (
              <TabBtn key={s} k={s} active={typeFilter === s} label={t.tabs[s]} count={nf.format(counts[s] || 0)} onSelect={setTypeFilter} />
            ))}
          </div>

          <div className="slim-scroll max-h-[68vh] overflow-auto" aria-busy={loading}>
            <table className="w-full min-w-[820px] border-collapse text-start">
              <thead className={HEAD_CLS}>
                <tr>
                  <SortTh label={t.columns.date} active={sortBy === 'newest' || sortBy === 'oldest'} dir={sortBy === 'oldest' ? 'asc' : 'desc'} onClick={toggleDateSort} />
                  <th scope="col" className={TH}>{t.columns.type}</th>
                  <th scope="col" className={TH}>{t.columns.method}</th>
                  <th scope="col" className={TH}>{t.columns.ref}</th>
                  <SortTh label={t.columns.amount} active={sortBy === 'highest' || sortBy === 'lowest'} dir={sortBy === 'lowest' ? 'asc' : 'desc'} onClick={toggleAmountSort} />
                </tr>
              </thead>
              <tbody className="nb-rows">
                {loading && rows.length === 0 ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {SKELETON_COLS.map((j) => (
                        <td key={j} className="px-3 py-4"><div className="nb-gray nb-line h-3.5 w-full border-2" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14">
                      <EmptyState3D kind="box" title={t.empty.title} subtitle={t.empty.sub} darkMode={darkMode} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => <TxnRow key={r.key} txn={r} loc={loc} onCopy={handleCopy} />)
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="nb-gray nb-line flex flex-col items-center justify-between gap-3 border-t-2 px-4 py-3 sm:flex-row">
              <p className="nb-muted text-xs font-semibold">
                {renderTpl(t.showing, {
                  range: <b className="tabular-nums" style={{ color: 'var(--nb-ink)' }}>{nf.format(from)}–{nf.format(to)}</b>,
                  total: <b className="tabular-nums" style={{ color: 'var(--nb-ink)' }}>{nf.format(filtered.length)}</b>,
                })}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} labels={tt} formatNumber={nf.format} />}
            </div>
          )}
        </section>
      </div>

      {showFilterPanel && (
        <FilterPanel
          title={t.filterTitle}
          note={t.filterNote}
          groups={filterGroups}
          labels={tt}
          onReset={resetFilters}
          onClose={closeFilter}
        />
      )}
    </div>
  );
};

export default memo(Transactions);