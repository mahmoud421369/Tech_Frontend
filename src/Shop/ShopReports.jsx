// src/pages/ShopReports.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiShoppingBag, FiTool, FiStar, FiTarget, FiBarChart2, FiRefreshCw,
  FiChevronLeft, FiAlertCircle, FiActivity, FiPieChart,
} from "react-icons/fi";
import { fetchPerformance } from "../common/api/shopReports";
import useAuthStore from "../common/store/Auth";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster } from "../components/user/UiExtras";
import {
  BTN_MD, CARD, SCROLL_CSS, useDarkMode, useShopLocale,
} from "../components/shop/TableKit";
import {
  FOCUS, LocaleCtx, useL, getFmt, toNum, pctOf, useMoney,
  useDateRange, useRangeResource,
  Panel, Metric, Delta, Meter, BreakdownRow, DateFilter, ScoreCard, InsightList,
  EmptyBlock, RetryBlock, SkeletonBlock,
} from "../components/shop/DashboardKit";
import { pickReportText } from "../components/shop/reportsText.js";
import { ensureShopAssets } from "../common/utils/shopFonts";

ensureShopAssets();

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const DASHBOARD_PATH = "/shop/dashboard";
const TAB_KEYS = ["orders", "repairs"];
const TAB_ICON = { orders: FiShoppingBag, repairs: FiTool };

const GOOD = "text-emerald-600 dark:text-emerald-300";
const BAD = "text-red-500";
const rateTone = (rate, goodAbove) => (toNum(rate) >= goodAbove ? GOOD : BAD);

/* ------------------------------------------------------------------ tabs (accessible, keyboard-friendly) */
const Tabs = memo(({ value, onChange, labels, ariaLabel }) => {
  const refs = useRef({});
  const onKeyDown = (e, i) => {
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % TAB_KEYS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + TAB_KEYS.length) % TAB_KEYS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TAB_KEYS.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(TAB_KEYS[next]);
    refs.current[TAB_KEYS[next]]?.focus();
  };
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {TAB_KEYS.map((k, i) => {
        const Icon = TAB_ICON[k];
        const active = value === k;
        return (
          <button
            key={k}
            ref={(el) => { refs.current[k] = el; }}
            id={`tab-${k}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`panel-${k}`}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(k)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={`${CARD} flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold uppercase ${FOCUS} ${active ? "nb-active" : "nb-gray"}`}
            style={active ? { background: "var(--nb-accent)", color: "#04261a" } : undefined}
          >
            <Icon size={14} aria-hidden="true" /> {labels[k]}
          </button>
        );
      })}
    </div>
  );
});

/* ------------------------------------------------------------------ satisfaction */
const Stars = ({ value }) => {
  const full = Math.round(Math.max(0, Math.min(5, toNum(value))));
  return (
    <span className="text-amber-400" aria-hidden="true" dir="ltr">
      {"★".repeat(full)}<span className="opacity-25">{"★".repeat(5 - full)}</span>
    </span>
  );
};

const SatisfactionPanel = memo(({ data }) => {
  const { r, f } = useL();
  const s = r.satisfaction;
  const total = toNum(data?.totalReviews);
  const dist = data?.ratingDistribution || {};
  const change = toNum(data?.ratingChange);

  return (
    <Panel title={s.title} subtitle={s.subtitle} icon={FiStar} className="h-full">
      {!data || total === 0 ? <EmptyBlock text={s.empty} /> : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-4xl font-extrabold tabular-nums">{f.dec.format(toNum(data.averageRating))}</p>
            <div className="min-w-0">
              <Stars value={data.averageRating} />
              <p className="nb-muted text-[11px] font-semibold tabular-nums">
                {f.num.format(total)} {s.reviews}
              </p>
              <p className="text-[11px] font-extrabold tabular-nums">
                <span className="nb-muted">{s.previous}: {f.dec.format(toNum(data.previousAverageRating))} </span>
                <span className={change >= 0 ? GOOD : BAD} dir="ltr">({change >= 0 ? "+" : "-"}{f.dec.format(Math.abs(change))})</span>
              </p>
            </div>
          </div>

          <div>
            <p className="nb-muted mb-2 text-[10px] font-bold uppercase">{s.distribution}</p>
            <ul className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = toNum(dist[star]);
                const pct = pctOf(count, total);
                return (
                  <li key={star} className="flex items-center gap-2 text-[11px] font-bold tabular-nums">
                    <span className="w-6 text-end" dir="ltr">{star}★</span>
                    <Meter pct={pct} color={star >= 4 ? "#34d399" : star === 3 ? "#fbbf24" : "#ef4444"} className="h-2.5 flex-1" />
                    <span className="w-8 text-end">{f.num.format(count)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Metric label={s.positive} value={`${f.pct.format(toNum(data.positiveRate))}%`} tone={GOOD} />
            <Metric label={s.negative} value={`${f.pct.format(toNum(data.negativeRate))}%`} tone={toNum(data.negativeRate) > 15 ? BAD : ""} />
            <Metric label={s.csat} value={`${f.pct.format(toNum(data.satisfactionScore))}%`} tone={rateTone(data.satisfactionScore, 70)} />
            <Metric
              label={s.nps}
              value={<span dir="ltr">{f.pct.format(toNum(data.netPromoterScore))}</span>}
              tone={toNum(data.netPromoterScore) >= 0 ? GOOD : BAD}
            />
            <div className="col-span-2">
              <Metric label={s.response} value={`${f.pct.format(toNum(data.reviewResponseRate))}%`} />
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
});

/* ------------------------------------------------------------------ orders tab */
const OrdersTab = memo(({ data }) => {
  const { r, f } = useL();
  const money = useMoney();
  const c = r.orders;
  const total = toNum(data.totalOrders);

  const rows = useMemo(() => [
    { key: "completed", label: c.completed, count: toNum(data.completedOrders), color: "#34d399" },
    { key: "pending", label: c.pending, count: toNum(data.pendingOrders), color: "#f59e0b" },
    { key: "cancelled", label: c.cancelled, count: toNum(data.cancelledOrders), color: "#ef4444" },
  ].map((x) => ({ ...x, pct: pctOf(x.count, total) })), [data, c, total]);

  const pct = (v) => `${f.pct.format(toNum(v))}%`;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Panel title={c.title} icon={FiActivity} className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Metric label={c.total} value={f.num.format(total)} extra={<Delta value={data.ordersPercentChange} />} />
          <Metric label={c.previous} value={f.num.format(toNum(data.previousTotalOrders))} />
          <Metric label={c.avgValue} value={money(data.averageOrderValue)} />
          <Metric label={c.completionRate} value={pct(data.completionRate)} tone={rateTone(data.completionRate, 70)} />
          <Metric label={c.cancellationRate} value={pct(data.cancellationRate)} tone={toNum(data.cancellationRate) > 15 ? BAD : ""} />
          <Metric label={c.unique} value={f.num.format(toNum(data.uniqueCustomers))} />
          <Metric label={c.repeat} value={f.num.format(toNum(data.repeatCustomers))} />
          <Metric label={c.repeatRate} value={pct(data.repeatCustomerRate)} tone={rateTone(data.repeatCustomerRate, 20)} />
        </div>
      </Panel>

      <Panel title={c.breakdown} icon={FiPieChart}>
        {total === 0 ? <EmptyBlock text={r.common.noData} /> : (
          <ul className="space-y-2.5">{rows.map((row) => <BreakdownRow key={row.key} row={row} />)}</ul>
        )}
      </Panel>
    </div>
  );
});

/* ------------------------------------------------------------------ repairs tab */
const RepairsTab = memo(({ data }) => {
  const { r, f } = useL();
  const money = useMoney();
  const c = r.repairs;
  const total = toNum(data.totalRepairs);
  const rev = data.revenue;
  const diff = toNum(rev?.difference);

  const rows = useMemo(() => [
    { key: "completed", label: c.completed, count: toNum(data.completedRepairs), color: "#34d399" },
    { key: "progress", label: c.inProgress, count: toNum(data.inProgressRepairs), color: "#3b82f6" },
    { key: "cancelled", label: c.cancelled, count: toNum(data.cancelledRepairs), color: "#ef4444" },
  ].map((x) => ({ ...x, pct: pctOf(x.count, total) })), [data, c, total]);

  const pct = (v) => `${f.pct.format(toNum(v))}%`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel title={c.title} icon={FiActivity} className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Metric label={c.total} value={f.num.format(total)} extra={<Delta value={data.repairsPercentChange} />} />
            <Metric label={c.previous} value={f.num.format(toNum(data.previousTotalRepairs))} />
            <Metric label={c.turnaround} value={`${f.pct.format(toNum(data.averageTurnaroundHours))} ${c.hours}`} />
            <Metric label={c.completionRate} value={pct(data.completionRate)} tone={rateTone(data.completionRate, 70)} />
            <Metric label={c.cancellationRate} value={pct(data.cancellationRate)} tone={toNum(data.cancellationRate) > 15 ? BAD : ""} />
            <Metric label={c.inProgress} value={f.num.format(toNum(data.inProgressRepairs))} />
          </div>
        </Panel>

        <Panel title={c.breakdown} icon={FiPieChart}>
          {total === 0 ? <EmptyBlock text={r.common.noData} /> : (
            <ul className="space-y-2.5">{rows.map((row) => <BreakdownRow key={row.key} row={row} />)}</ul>
          )}
        </Panel>
      </div>

      <Panel title={c.revenue} icon={FiBarChart2}>
        {!rev ? <EmptyBlock text={r.common.noData} /> : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Metric label={c.revenueTotal} value={money(rev.totalSales)} extra={<Delta value={rev.percentChange} />} />
            <Metric label={c.revenuePrevious} value={money(rev.previousSales)} />
            <Metric
              label={c.revenueDiff}
              value={<span dir="ltr">{diff >= 0 ? "+" : "-"}{money(Math.abs(diff))}</span>}
              tone={diff >= 0 ? GOOD : BAD}
            />
          </div>
        )}
      </Panel>
    </div>
  );
});

/* ------------------------------------------------------------------ page */
const ShopReports = ({ darkMode: darkModeProp }) => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hookDark = useDarkMode();
  const darkMode = darkModeProp ?? hookDark;
  const loc = useShopLocale();
  const { language, L, dir, font } = loc;
  const isAr = loc.isAr ?? language === "ar";
  const t = L.dashboard;
  const r = pickReportText(loc);
  const f = getFmt(L.locale || (isAr ? "ar-EG" : "en-US"));
  const fontFamily = font?.fontFamily;
  const ctx = useMemo(() => ({ t, r, f, fontFamily, darkMode }), [t, r, f, fontFamily, darkMode]);

  useEffect(() => { document.title = r.docTitle; }, [r.docTitle]);
  useEffect(() => { if (!accessToken) navigate("/login"); }, [accessToken, navigate]);

  const range = useDateRange(t);
  const report = useRangeResource(fetchPerformance, range.applied);
  const [tab, setTab] = useState("orders");
  const changeTab = useCallback((k) => { if (TAB_KEYS.includes(k)) setTab(k); }, []);

  const data = report.data;
  const first = report.loading && !data;

  return (
    <LocaleCtx.Provider value={ctx}>
      <div dir={dir} lang={language} style={font} className="nb-page min-h-screen py-6 lg:ps-64 mt-16 text-start">
        <style>{PAGE_CSS}</style>
        <Defs3D />
        <Toaster darkMode={darkMode} />

        <div key={language} className="lang-fade mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <button type="button" onClick={() => navigate(DASHBOARD_PATH)} className={`${BTN_MD} mb-3 h-8 uppercase`}>
                <FiChevronLeft size={14} className="rtl:rotate-180" aria-hidden="true" /> {r.backToDashboard}
              </button>
              <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight rtl:tracking-normal sm:text-3xl">
                <span className="nb-ul">{r.title}</span>
              </h1>
              <p className="nb-muted mt-2 text-xs font-semibold">{r.subtitle}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="nb-chip !normal-case" role="status" aria-live="polite">
                {t.lastUpdated}: <span className="tabular-nums">{report.updatedAt ? f.time.format(report.updatedAt) : "..."}</span>
              </div>
              <button type="button" onClick={report.reload} aria-label={t.refresh} title={t.refresh} className={`${BTN_MD} h-10 uppercase`}>
                <FiRefreshCw size={14} className={report.loading ? "animate-spin motion-reduce:animate-none" : ""} /> {t.refresh}
              </button>
            </div>
          </div>

          <DateFilter
            startDate={range.startDate}
            endDate={range.endDate}
            onStartChange={range.onStartChange}
            onEndChange={range.onEndChange}
            onRange={range.onRange}
            onReset={range.reset}
            error={range.error}
            loading={report.loading && !!data}
          />

          {report.error && data && (
            <div role="alert" className="nb-card flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 !border-red-500">
              <p className="flex items-center gap-2 text-[11px] font-bold text-red-600 dark:text-red-300">
                <FiAlertCircle size={14} className="flex-shrink-0" aria-hidden="true" /> {t.errors.partial}
              </p>
              <button type="button" onClick={report.reload} className={`${BTN_MD} h-8 uppercase`}>{t.retry}</button>
            </div>
          )}

          {first ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3" aria-busy="true">
              <SkeletonBlock className="h-72" /><SkeletonBlock className="h-72" /><SkeletonBlock className="h-72" />
            </div>
          ) : !data ? (
            <div className={`${CARD} p-5`}><RetryBlock onRetry={report.reload} /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3" aria-busy={report.loading}>
                <Panel title={r.score.title} icon={FiTarget}>
                  <ScoreCard score={data.overallScore} />
                </Panel>
                <SatisfactionPanel data={data.satisfaction} />
                <Panel title={r.insights.title} subtitle={r.insights.subtitle} icon={FiBarChart2}>
                  <div className="slim-scroll max-h-[420px] overflow-y-auto pe-1">
                    <InsightList insights={data.insights} />
                  </div>
                </Panel>
              </div>

              <div className="space-y-5">
                <Tabs value={tab} onChange={changeTab} labels={r.tabs} ariaLabel={r.tabsAria} />
                {/* Only the active tab is mounted: less DOM, less work per render. */}
                <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className={FOCUS}>
                  {tab === "orders"
                    ? (data.orders ? <OrdersTab data={data.orders} /> : <EmptyBlock text={r.common.noData} />)
                    : (data.repairs ? <RepairsTab data={data.repairs} /> : <EmptyBlock text={r.common.noData} />)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </LocaleCtx.Provider>
  );
};

export default memo(ShopReports);