import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  FiCheck, FiZap, FiActivity, FiClock, FiShield, FiCreditCard, FiDollarSign, FiRefreshCw,
} from 'react-icons/fi';
import api from '../common/api/api';
import { UI3D_CSS, Defs3D } from '../components/user/Ui3D';
import { EXTRAS_CSS, Toaster, toast, EmptyState3D } from '../components/user/UiExtras';
import {
  BTN, BTN_MD, BTN_PRIMARY, CARD, PANEL, TH, SCROLL_CSS,
  toTs, fmt, formatPrice, tpl, renderTpl, shortId, errText, confirmDialog,
  useDarkMode, useShopLocale, StatCard, RowsDropdown, Pagination, SectionTitle,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';

ensureShopAssets();

const PRICE_PER_MONTH = { COMMISSION: 1000, RATIO: 800 };
const PLANS = Object.keys(PRICE_PER_MONTH);
const DURATIONS = [1, 3, 6, 12];
const TAB_KEYS = ['all', 'active', 'expired'];
const SKELETON_ROWS = [0, 1, 2, 3];
const SKELETON_COLS = [0, 1, 2, 3];

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const INK = '#04261a';
const ACTIVE_CHIP = { background: '#34d399', color: INK };
const EXPIRED_CHIP = { background: '#ef4444', color: '#ffffff' };
const HEAD_CLS = 'sticky top-0 z-10 nb-gray shadow-[0_2px_0_0_var(--nb-line)]';

const PAYMENT_HOSTS = [];

const safePaymentUrl = (raw) => {
  try {
    const u = new URL(String(raw));
    if (u.protocol !== 'https:') return null;
    if (PAYMENT_HOSTS.length && !PAYMENT_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))) return null;
    return u.href;
  } catch { return null; }
};

const payError = (err, e) => {
  const status = err?.response?.status;
  const data = err?.response?.data || {};
  const raw = String(data.message || '');
  const code = String(data.error_code || data.code || '');
  if (/amount_cents|amount must|price must/i.test(raw)) return e.amount;
  if (/payment not found/i.test(raw)) return e.paymentNotFound;
  if (/not a cash payment/i.test(raw)) return e.notCash;
  if (/no enum constant|paymentstatus|cannot be converted|invalid status/i.test(raw)) return e.badStatus;
  if (/not found/i.test(raw) || status === 404) return e.notFound;
  if (/already completed/i.test(raw)) return e.alreadyCompleted;
  if (/duplicate|paymob|unprocessable/i.test(raw) || status === 422) return e.duplicate;
  if (status === 401) return e.session;
  if (status === 403) return e.forbidden;
  if (status >= 500 || /RUNTIME_ERROR|RT_001/i.test(`${raw} ${code}`)) return e.unexpected;
  return errText(err);
};

const isActiveSub = (end) => toTs(end) > Date.now();



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

const ChoiceCard = memo(({ value, on, onSelect, className = '', children }) => {
  const click = useCallback(() => onSelect(value), [onSelect, value]);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={click}
      className={`${BTN} ${className} ${on ? 'nb-btn-on' : ''}`}
    >
      {children}
    </button>
  );
});

const SubRow = memo(({ sub, loc }) => {
  const { L, fm } = loc;
  const t = L.subs;
  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-3">
        <p className="text-xs font-extrabold">{t.plans[sub.type]?.label || sub.type || '—'}</p>
        <p dir="ltr" className="nb-muted text-start text-[10px] font-bold tabular-nums">#{shortId(sub.id)}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-[13px] font-extrabold tabular-nums">{formatPrice(sub.totalAmount, L.table.price, fm.number)}</td>
      <td className="whitespace-nowrap px-3 py-3">
        <p className="text-xs font-extrabold">{fmt(fm.date, sub.startDate)}</p>
        <p className="nb-muted text-[10px] font-semibold">{tpl(t.history.to, { d: fmt(fm.date, sub.endDate) })}</p>
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <span className="nb-chip !normal-case" style={sub.active ? ACTIVE_CHIP : EXPIRED_CHIP}>
          {sub.active ? t.status.active : t.status.expired}
        </span>
      </td>
    </tr>
  );
});



const Subscriptions = () => {
  const darkMode = useDarkMode();
  const loc = useShopLocale();
  const { language, L, fm, dir, font } = loc;
  const t = L.subs;
  const tt = L.table;
  const nf = fm.number;

  const [currentSub, setCurrentSub] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [duration, setDuration] = useState(1);
  const [type, setType] = useState('COMMISSION');
  const [tab, setTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const submittingRef = useRef(false);
  const abortRef = useRef(null);
  const locRef = useRef(loc);
  useEffect(() => { locRef.current = loc; }, [loc]);
  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  useEffect(() => {
    const onShow = (e) => { if (e.persisted) { submittingRef.current = false; setSubmitting(false); } };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;
    setLoading(true);
    const [cur, all] = await Promise.allSettled([
      api.get('/api/subscriptions', { signal }),
      api.get('/api/subscriptions/all', { signal }),
    ]);
    if (signal.aborted) return;
    if (cur.status === 'fulfilled') {
      const d = cur.value.data;
      setCurrentSub((Array.isArray(d) ? d[0] : d) || null);
    }
    if (all.status === 'fulfilled') {
      const d = all.value.data;
      setAllSubs((Array.isArray(d) ? d : d?.content || []).map((s) => ({ ...s, active: isActiveSub(s.endDate) })));
    }
    if (cur.status === 'rejected' && all.status === 'rejected') {
      const x = locRef.current.L.subs;
      toast({ icon: 'error', title: x.toasts.loadFail, text: payError(cur.reason, x.errors) });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); return () => abortRef.current?.abort(); }, [fetchData]);

  const handleSubscribe = useCallback(async (method) => {
    if (submittingRef.current) return;
    const { L: LL, fm: ff } = locRef.current;
    const x = LL.subs;
    if (!PLANS.includes(type) || !DURATIONS.includes(duration)) {
      toast({ icon: 'error', title: x.toasts.invalidChoice, text: x.toasts.invalidChoiceText });
      return;
    }
    const card = method === 'card';
    let isConfirmed = false;
    try {
      ({ isConfirmed } = await confirmDialog({
        title: card ? x.confirm.cardTitle : x.confirm.cashTitle,
        text: `${x.plans[type].label} · ${x.durations[duration]} · ${formatPrice(PRICE_PER_MONTH[type] * duration, LL.table.price, ff.number)}`,
        icon: 'question',
        confirmButtonText: card ? x.confirm.cardBtn : x.confirm.cashBtn,
        cancelButtonText: LL.table.cancel,
        confirmButtonColor: '#10b981',
      }));
    } catch {
      toast({ icon: 'error', title: x.toasts.confirmFail, text: x.toasts.confirmFailText });
      return;
    }
    if (!isConfirmed) return;

    submittingRef.current = true;
    setSubmitting(true);
    let leaving = false;
    try {
      const res = await api.post(card ? '/api/subscriptions/card' : '/api/subscriptions/cash', { months: duration, type });
      if (card) {
        const url = safePaymentUrl(res.data?.paymentURL);
        if (!url) {
          toast({ icon: 'error', title: res.data?.paymentURL ? x.toasts.unsafeLink : x.toasts.noLink, text: x.toasts.noLinkText });
          fetchData();
          return;
        }
        leaving = true;
        window.location.assign(url);
        return;
      }
      toast({ icon: 'success', title: x.toasts.cashSent });
      fetchData();
    } catch (err) {
      const y = locRef.current.L.subs;
      toast({ icon: 'error', title: y.toasts.failed, text: payError(err, y.errors) });
    } finally {
      if (!leaving) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  }, [duration, type, fetchData]);

  const payByCard = useCallback(() => handleSubscribe('card'), [handleSubscribe]);
  const payByCash = useCallback(() => handleSubscribe('cash'), [handleSubscribe]);
  const refresh = useCallback(() => fetchData(), [fetchData]);

  const sorted = useMemo(() => [...allSubs].sort((a, b) => toTs(b.startDate) - toTs(a.startDate)), [allSubs]);
  const counts = useMemo(() => {
    const active = allSubs.filter((s) => s.active).length;
    return { all: allSubs.length, active, expired: allSubs.length - active };
  }, [allSubs]);
  const filtered = useMemo(() => (tab === 'all' ? sorted : sorted.filter((s) => s.active === (tab === 'active'))), [sorted, tab]);

  useEffect(() => { setCurrentPage(1); }, [tab, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);
  const from = filtered.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, filtered.length);

  const activeNow = isActiveSub(currentSub?.endDate);
  const statCards = useMemo(() => [
    { label: t.stats.status.label, value: activeNow ? t.stats.status.active : t.stats.status.expired, description: t.stats.status.desc, icon: FiShield, tone: activeNow ? 'em' : 'ro' },
    { label: t.stats.expiry.label, value: currentSub?.endDate ? fmt(fm.date, currentSub.endDate) : '—', description: t.stats.expiry.desc, icon: FiClock, tone: 'am' },
    { label: t.stats.plan.label, value: currentSub?.type ? (t.plans[currentSub.type]?.label || currentSub.type) : t.stats.plan.none, description: t.stats.plan.desc, icon: FiZap, tone: 'sky' },
    { label: t.stats.ops.label, value: nf.format(allSubs.length), description: t.stats.ops.desc, icon: FiActivity, tone: 'vi' },
  ], [currentSub, allSubs.length, activeNow, t, fm, nf]);

  const total = PRICE_PER_MONTH[type] * duration;

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
          <button type="button" onClick={refresh} aria-label={tt.refresh} title={tt.refresh} className={`${BTN_MD} h-10 uppercase rtl:tracking-normal`}>
            <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> {tt.refresh}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <section className={`${CARD} space-y-5 p-5 lg:col-span-1`}>
            <div className="space-y-3">
              <SectionTitle>{t.choosePlan}</SectionTitle>
              <div role="radiogroup" aria-label={t.planAria} className="space-y-2.5">
                {PLANS.map((p) => (
                  <ChoiceCard key={p} value={p} on={type === p} onSelect={setType} className="w-full !items-start !justify-between p-3.5 text-start">
                    <span className="space-y-1">
                      <span className="block text-[10px] font-bold uppercase opacity-80 rtl:tracking-normal">{t.plans[p].badge}</span>
                      <span className="block text-xs font-extrabold uppercase rtl:tracking-normal">{t.plans[p].label}</span>
                      <span className="block text-base font-extrabold tabular-nums">
                        {formatPrice(PRICE_PER_MONTH[p], tt.price, nf)} <span className="text-[10px] font-semibold opacity-80">{t.perMonth}</span>
                      </span>
                    </span>
                    {type === p && (
                      <span className="nb-ico h-5 w-5 flex-shrink-0" style={{ background: '#34d399' }}><FiCheck size={12} aria-hidden="true" /></span>
                    )}
                  </ChoiceCard>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <SectionTitle>{t.durationTitle}</SectionTitle>
              <div role="radiogroup" aria-label={t.durationAria} className="grid grid-cols-2 gap-2.5">
                {DURATIONS.map((m) => (
                  <ChoiceCard key={m} value={m} on={duration === m} onSelect={setDuration} className="py-2.5 text-xs uppercase rtl:tracking-normal">
                    {t.durations[m]}
                  </ChoiceCard>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className={`${PANEL} flex items-center justify-between px-4 py-3`}>
                <span className="nb-muted text-[10px] font-bold uppercase rtl:tracking-normal">{t.totalDue}</span>
                <span className="text-xl font-extrabold tabular-nums">{formatPrice(total, tt.price, nf)}</span>
              </div>
              <div className="flex gap-2.5">
                <button type="button" disabled={submitting} onClick={payByCard} className={`${BTN_PRIMARY} h-10 flex-1 uppercase rtl:tracking-normal`}>
                  <FiCreditCard size={13} aria-hidden="true" /> {t.payCard}
                </button>
                <button type="button" disabled={submitting} onClick={payByCash} className={`${BTN_MD} h-10 flex-1 uppercase rtl:tracking-normal`}>
                  <FiDollarSign size={13} aria-hidden="true" /> {t.payCash}
                </button>
              </div>
              <p className="nb-muted text-[10px] font-semibold leading-relaxed">{t.note}</p>
            </div>
          </section>

          <section className={`${CARD} min-w-0 overflow-hidden lg:col-span-2`}>
            <div className="nb-gray nb-line flex flex-wrap items-center justify-between gap-2 border-b-2 px-4 py-3.5 sm:px-5">
              <SectionTitle>{t.history.title}</SectionTitle>
              <RowsDropdown value={rowsPerPage} onChange={setRowsPerPage} label={tt.rows} formatNumber={nf.format} />
            </div>

            <div role="tablist" aria-label={t.history.tabsAria} className="slim-scroll nb-line flex gap-2 overflow-x-auto border-b-2 p-3">
              {TAB_KEYS.map((key) => (
                <TabBtn key={key} k={key} active={tab === key} label={t.tabs[key]} count={nf.format(counts[key])} onSelect={setTab} />
              ))}
            </div>

            <div className="slim-scroll max-h-[60vh] overflow-auto" aria-busy={loading}>
              <table className="w-full min-w-[560px] border-collapse text-start">
                <thead className={HEAD_CLS}>
                  <tr>
                    <th scope="col" className={TH}>{t.history.columns.type}</th>
                    <th scope="col" className={TH}>{t.history.columns.amount}</th>
                    <th scope="col" className={TH}>{t.history.columns.validity}</th>
                    <th scope="col" className={TH}>{t.history.columns.status}</th>
                  </tr>
                </thead>
                <tbody className="nb-rows">
                  {loading && allSubs.length === 0 ? (
                    SKELETON_ROWS.map((i) => (
                      <tr key={i} className="animate-pulse motion-reduce:animate-none">
                        {SKELETON_COLS.map((j) => (
                          <td key={j} className="px-3 py-4"><div className="nb-gray nb-line h-3.5 w-full border-2" /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12">
                        <EmptyState3D kind="box" title={t.history.emptyTitle} subtitle={t.history.emptySub} darkMode={darkMode} />
                      </td>
                    </tr>
                  ) : (
                    paginated.map((s) => <SubRow key={s.id ?? `${s.startDate}-${s.type}`} sub={s} loc={loc} />)
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div className="nb-gray nb-line flex flex-col items-center justify-between gap-3 border-t-2 px-4 py-3 sm:flex-row">
                <p className="nb-muted text-xs font-semibold">
                  {renderTpl(t.history.showing, {
                    range: <b className="tabular-nums" style={{ color: 'var(--nb-ink)' }}>{nf.format(from)}–{nf.format(to)}</b>,
                    total: <b className="tabular-nums" style={{ color: 'var(--nb-ink)' }}>{nf.format(filtered.length)}</b>,
                  })}
                </p>
                {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setCurrentPage} labels={tt} formatNumber={nf.format} />}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default memo(Subscriptions);