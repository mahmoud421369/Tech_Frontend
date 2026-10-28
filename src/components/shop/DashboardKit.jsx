// src/components/shop/DashboardKit.jsx
// Shared primitives, hooks and helpers used by ShopDashboard and ShopReports.
import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo, createContext, useContext,
} from "react";
import {
  FiCalendar, FiRefreshCw, FiAlertCircle, FiTrendingUp, FiTrendingDown, FiTarget,
  FiCheckCircle, FiInfo, FiAlertTriangle,
} from "react-icons/fi";
import { EmptyState3D, toast } from "../user/UiExtras";
import { BTN_MD, BTN_PRIMARY, CARD, PANEL, FIELD, LABEL, IconTile } from "./TableKit";

/* ------------------------------------------------------------------ constants */
export const INK = "#04261a";
export const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400";
export const REDUCED =
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ context */
// value: { t, f, r, fontFamily, darkMode }  (t = L.dashboard, r = report text)
export const LocaleCtx = createContext(null);
export const useL = () => useContext(LocaleCtx);

/* ------------------------------------------------------------------ formatting */
const FMT_CACHE = {};
export const getFmt = (locale) =>
  (FMT_CACHE[locale] ||= {
    num: new Intl.NumberFormat(locale),
    pct: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    dec: new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 1 }),
    day: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }),
    monthYear: new Intl.DateTimeFormat(locale, { month: "short", year: "2-digit" }),
    time: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    longMonth: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    todayLong: new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }),
  });

export const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const normStatus = (s) => (s ? String(s).toUpperCase() : "");
export const clampPct = (n) => Math.max(0, Math.min(100, toNum(n)));
export const pctOf = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);

export const useMoney = () => {
  const { f, t } = useL();
  return useCallback((v) => `${f.num.format(toNum(v))} ${t.currency}`, [f, t.currency]);
};

/* ------------------------------------------------------------------ dates (ISO day: yyyy-MM-dd) */
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MIN_DAY = "2000-01-01";
export const MAX_DAY = "2100-12-31";

export const toDateInput = (date) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
};

export const parseDateInput = (v) => {
  if (typeof v !== "string" || v.length !== 10 || !DAY_RE.test(v)) return null;
  const [y, m, d] = v.split("-").map(Number);
  if (y < 2000 || y > 2100) return null;
  const date = new Date(y, m - 1, d);
  return toDateInput(date) === v ? date : null; // rejects 2026-02-31 etc.
};

/** Date filter state: raw inputs + debounced "applied" range + validation. */
export const useDateRange = (t) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fieldError, setFieldError] = useState(false);
  const [applied, setApplied] = useState({ startDate: "", endDate: "" });
  const tRef = useRef(t);
  tRef.current = t;

  const onStartChange = useCallback((v) => {
    if (v === "" || parseDateInput(v)) { setStartDate(v); setFieldError(false); } else setFieldError(true);
  }, []);
  const onEndChange = useCallback((v) => {
    if (v === "" || parseDateInput(v)) { setEndDate(v); setFieldError(false); } else setFieldError(true);
  }, []);
  const onRange = useCallback((s, e) => { setStartDate(s); setEndDate(e); setFieldError(false); }, []);
  const reset = useCallback(() => {
    setStartDate(""); setEndDate(""); setFieldError(false);
    toast({ icon: "success", title: tRef.current.filter.resetToast });
  }, []);

  const rangeInvalid = useMemo(() => {
    const s = parseDateInput(startDate);
    const e = parseDateInput(endDate);
    return !!(s && e && s > e);
  }, [startDate, endDate]);

  // Debounce so typing/clicking presets doesn't spam the API; never apply an invalid range.
  useEffect(() => {
    if (rangeInvalid) return undefined;
    const id = setTimeout(() => {
      setApplied((p) => (p.startDate === startDate && p.endDate === endDate ? p : { startDate, endDate }));
    }, 400);
    return () => clearTimeout(id);
  }, [startDate, endDate, rangeInvalid]);

  const error = fieldError ? t.filter.invalidDate : rangeInvalid ? t.filter.rangeError : "";
  return { startDate, endDate, applied, error, onStartChange, onEndChange, onRange, reset };
};

/* ------------------------------------------------------------------ data hook */
/**
 * Loads fetcher(range, signal). Cancels stale requests, ignores aborted ones,
 * optional silent polling (paused while the tab is hidden).
 * `fetcher` MUST be a stable reference (module-level function).
 */
export const useRangeResource = (fetcher, range, { pollMs = 0 } = {}) => {
  const [state, setState] = useState({ data: null, loading: true, error: false, updatedAt: null });
  const abortRef = useRef(null);
  const { startDate, endDate } = range;

  const load = useCallback(async (silent = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setState((s) => ({ ...s, loading: true }));
    try {
      const data = await fetcher({ startDate, endDate }, controller.signal);
      if (!controller.signal.aborted) setState({ data, loading: false, error: false, updatedAt: new Date() });
    } catch {
      if (!controller.signal.aborted) setState((s) => ({ ...s, loading: false, error: true }));
    }
  }, [fetcher, startDate, endDate]);

  useEffect(() => {
    load(false);
    const id = pollMs ? setInterval(() => { if (!document.hidden) load(true); }, pollMs) : null;
    return () => { if (id) clearInterval(id); abortRef.current?.abort(); };
  }, [load, pollMs]);

  const reload = useCallback(() => load(false), [load]);
  return { ...state, reload };
};

export const useInView = (margin = "240px") => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (seen || !ref.current) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, margin]);
  return [ref, seen];
};

/* ------------------------------------------------------------------ status colours */
export const STATUS_STYLE = {
  PENDING:     { hex: "#f59e0b", ink: INK },
  SUBMITTED:   { hex: "#f59e0b", ink: INK },
  PROCESSING:  { hex: "#3b82f6", ink: "#ffffff" },
  IN_PROGRESS: { hex: "#3b82f6", ink: "#ffffff" },
  SHIPPED:     { hex: "#6366f1", ink: "#ffffff" },
  DELIVERED:   { hex: "#10b981", ink: INK },
  COMPLETED:   { hex: "#34d399", ink: INK },
  REJECTED:    { hex: "#ef4444", ink: "#ffffff" },
  CANCELLED:   { hex: "#ef4444", ink: "#ffffff" },
};
const FALLBACK_STATUS = { hex: "#9ca3af", ink: INK };
export const getStatusStyle = (s) => STATUS_STYLE[normStatus(s)] || FALLBACK_STATUS;

/* ------------------------------------------------------------------ primitives */
export const Spinner = memo(({ size = 20, className = "" }) => (
  <svg className={`animate-spin motion-reduce:animate-none ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-20" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
));

export const SectionTitle = ({ icon: Icon, children }) => (
  <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase">
    {Icon && <Icon size={14} className="nb-ic flex-shrink-0" aria-hidden="true" />}
    <span className="nb-ul">{children}</span>
  </h3>
);

export const Meter = memo(({ pct, color, className = "h-2.5" }) => (
  <span className={`nb-gray nb-line block overflow-hidden border-2 ${className}`} aria-hidden="true">
    <span
      className="block h-full"
      style={{ width: `${clampPct(pct)}%`, background: color || "var(--nb-accent)", transition: REDUCED ? "none" : "width .5s ease" }}
    />
  </span>
));

export const SkeletonBlock = ({ className }) => (
  <div className={`${CARD} nb-gray animate-pulse motion-reduce:animate-none ${className}`} />
);

export const EmptyBlock = ({ text }) => {
  const { darkMode } = useL();
  return (
    <div className="flex h-full items-center justify-center py-4">
      <EmptyState3D kind="box" title={text} darkMode={darkMode} />
    </div>
  );
};

export const LoadingBlock = () => {
  const { t } = useL();
  return (
    <div role="status" aria-label={t.loadingAria} className="nb-ic flex h-full items-center justify-center py-10">
      <Spinner size={24} />
    </div>
  );
};

export const RetryBlock = ({ onRetry }) => {
  const { t } = useL();
  return (
    <div className="py-6 text-center">
      <p role="alert" className="text-xs font-bold text-red-500">{t.errors.load}</p>
      <button type="button" onClick={onRetry} className={`${BTN_MD} mt-2 h-8 uppercase`}>{t.retry}</button>
    </div>
  );
};

export const Panel = memo(({ title, subtitle, icon, action, children, className = "" }) => (
  <section className={`${CARD} flex min-w-0 flex-col p-5 ${className}`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <SectionTitle icon={icon}>{title}</SectionTitle>
        {subtitle && <p className="nb-muted mt-1.5 text-[11px] font-semibold">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
));

export const StatusChip = ({ status, labels }) => {
  const st = getStatusStyle(status);
  return (
    <span className="nb-chip !normal-case" style={{ background: st.hex, color: st.ink }}>
      {labels[normStatus(status)] || status || "—"}
    </span>
  );
};

export const Metric = memo(({ label, value, tone, extra }) => (
  <div className={`${PANEL} min-w-0 px-3.5 py-3`}>
    <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
    <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
      <p className={`truncate text-lg font-extrabold tabular-nums ${tone || ""}`}>{value}</p>
      {extra}
    </div>
  </div>
));

/** +12.5% / -3% chip. Renders nothing when value is null/undefined. */
export const Delta = memo(({ value, invert = false }) => {
  const { f } = useL();
  if (value === null || value === undefined || value === "") return null;
  const n = toNum(value);
  const up = n >= 0;
  const good = invert ? !up : up;
  const Icon = up ? FiTrendingUp : FiTrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold tabular-nums ${good ? "text-emerald-600 dark:text-emerald-300" : "text-red-500"}`}>
      <Icon size={12} aria-hidden="true" />
      <span dir="ltr">{up ? "+" : "-"}{f.pct.format(Math.abs(n))}%</span>
    </span>
  );
});

export const BreakdownRow = memo(({ row }) => {
  const { f } = useL();
  return (
    <li className={`${PANEL} p-3`}>
      <div className="flex items-center gap-2.5">
        <span className="nb-line h-3 w-3 flex-shrink-0 border-2" style={{ background: row.color }} aria-hidden="true" />
        <span className="flex-1 truncate text-xs font-extrabold uppercase">{row.label}</span>
        <span className="text-sm font-extrabold tabular-nums">{f.num.format(row.count)}</span>
        <span className="nb-muted w-10 text-end text-[11px] font-bold tabular-nums">{f.num.format(row.pct)}%</span>
      </div>
      <div className="mt-2"><Meter pct={row.pct} color={row.color} className="h-2" /></div>
    </li>
  );
});

/* ------------------------------------------------------------------ stat tile */
export const StatTile = memo(({ meta, label, caption, value, percent, delta, onNavigate, wide }) => (
  <button
    type="button"
    onClick={() => onNavigate(meta.to)}
    className={`${CARD} min-w-0 p-4 text-start transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none ${FOCUS} ${wide ? "sm:col-span-2" : ""}`}
  >
    <div className="flex items-center gap-3">
      <IconTile icon={meta.icon} tone={meta.tone} className="h-11 w-11 flex-shrink-0" size={19} />
      <div className="min-w-0 flex-1">
        <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
        <p className="truncate text-xl font-extrabold leading-tight tabular-nums">{value}</p>
      </div>
      <Delta value={delta} />
    </div>
    {percent !== undefined && (
      <div className="mt-3 flex items-center gap-2">
        <Meter pct={percent} color={meta.color} className="h-2.5 flex-1" />
        <span className="w-9 text-end text-[10px] font-extrabold tabular-nums">{percent}%</span>
      </div>
    )}
    <p className={`nb-muted truncate text-[11px] font-semibold ${percent !== undefined ? "mt-2" : "mt-3"}`}>{caption}</p>
  </button>
));

/* ------------------------------------------------------------------ date filter */
const PRESETS = ["today", "week", "month", "all"];

export const DateFilter = memo(({ startDate, endDate, onStartChange, onEndChange, onRange, onReset, error, loading }) => {
  const { t } = useL();
  const d = t.filter;

  const applyPreset = useCallback((key) => {
    if (key === "all") { onReset(); return; }
    const now = new Date();
    let start;
    if (key === "today") start = now;
    else if (key === "week") start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    else start = new Date(now.getFullYear(), now.getMonth(), 1);
    onRange(toDateInput(start), toDateInput(now));
  }, [onRange, onReset]);

  const fields = [
    { id: "df-from", label: d.from, value: startDate, onChange: onStartChange, min: MIN_DAY, max: endDate || MAX_DAY },
    { id: "df-to", label: d.to, value: endDate, onChange: onEndChange, min: startDate || MIN_DAY, max: MAX_DAY },
  ];

  return (
    <section className={`${CARD} space-y-4 p-4 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle icon={FiCalendar}>{d.title}</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((k) => (
            <button key={k} type="button" onClick={() => applyPreset(k)} className={`${BTN_MD} h-8 uppercase`}>{d.presets[k]}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((fld) => (
            <div key={fld.id}>
              <label htmlFor={fld.id} className={LABEL}>{fld.label}</label>
              <input
                id={fld.id}
                type="date"
                value={fld.value}
                min={fld.min}
                max={fld.max}
                autoComplete="off"
                aria-invalid={!!error}
                onChange={(e) => fld.onChange(e.target.value)}
                className={`${FIELD} w-full`}
              />
            </div>
          ))}
        </div>
        <button type="button" onClick={onReset} className={`${BTN_PRIMARY} h-10 shrink-0 uppercase`}>
          {loading ? <Spinner size={13} /> : <FiRefreshCw size={13} aria-hidden="true" />} {d.reset}
        </button>
      </div>

      {error && (
        <p role="alert" className="nb-card flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold !border-red-500 text-red-600 dark:text-red-300">
          <FiAlertCircle size={13} aria-hidden="true" /> {error}
        </p>
      )}
    </section>
  );
});

/* ------------------------------------------------------------------ score + insights */
export const ScoreCard = memo(({ score }) => {
  const { r, f } = useL();
  const s = Math.round(clampPct(score));
  const tone = s >= 75 ? { c: "#34d399", label: r.score.good } : s >= 50 ? { c: "#fbbf24", label: r.score.fair } : { c: "#ef4444", label: r.score.poor };
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5">
      <svg width="112" height="112" viewBox="0 0 112 112" role="img" aria-label={`${r.score.title}: ${s}/100`} className="flex-shrink-0">
        <circle cx="56" cy="56" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="opacity-15" />
        <circle
          cx="56" cy="56" r={R} fill="none" stroke={tone.c} strokeWidth="10" strokeLinecap="butt"
          strokeDasharray={C} strokeDashoffset={C * (1 - s / 100)} transform="rotate(-90 56 56)"
          style={{ transition: REDUCED ? "none" : "stroke-dashoffset .6s ease" }}
        />
        <text x="56" y="62" textAnchor="middle" className="fill-current text-2xl font-extrabold" style={{ fontSize: 26, fontWeight: 800 }}>{f.num.format(s)}</text>
      </svg>
      <div className="min-w-0">
        <span className="nb-chip !normal-case" style={{ background: tone.c, color: INK }}>{tone.label}</span>
        <p className="nb-muted mt-2 text-[11px] font-semibold">{r.score.caption}</p>
      </div>
    </div>
  );
});

const SEVERITY = {
  CRITICAL: { rank: 0, icon: FiAlertCircle, hex: "#ef4444" },
  WARNING:  { rank: 1, icon: FiAlertTriangle, hex: "#fbbf24" },
  INFO:     { rank: 2, icon: FiInfo, hex: "#38bdf8" },
  POSITIVE: { rank: 3, icon: FiCheckCircle, hex: "#34d399" },
};
const FALLBACK_SEV = SEVERITY.INFO;

export const InsightList = memo(({ insights, limit }) => {
  const { r } = useL();
  const items = useMemo(() => {
    const list = Array.isArray(insights) ? insights : [];
    const sorted = [...list].sort(
      (a, b) => (SEVERITY[a?.severity] || FALLBACK_SEV).rank - (SEVERITY[b?.severity] || FALLBACK_SEV).rank,
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [insights, limit]);

  if (items.length === 0) return <EmptyBlock text={r.insights.empty} />;
  return (
    <ul className="space-y-2.5">
      {items.map((it, i) => {
        const sev = SEVERITY[it.severity] || FALLBACK_SEV;
        const Icon = sev.icon;
        return (
          <li key={`${it.area}-${i}`} className={`${PANEL} p-3`} style={{ borderInlineStart: `6px solid ${sev.hex}` }}>
            <div className="flex items-start gap-2.5">
              <Icon size={15} className="mt-0.5 flex-shrink-0" style={{ color: sev.hex }} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase">{r.insights.severity[it.severity] || it.severity}</span>
                  {it.area && <span className="nb-muted text-[10px] font-bold uppercase">· {it.area}</span>}
                </div>
                <p className="mt-1 text-xs font-bold">{it.message}</p>
                {it.recommendation && (
                  <p className="nb-muted mt-1 text-[11px] font-semibold">
                    <span className="font-extrabold">{r.insights.recommendation}:</span> {it.recommendation}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
});

export { FiTarget, FiRefreshCw, FiAlertCircle, FiCalendar };