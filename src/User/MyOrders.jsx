import React, {
  useState, useEffect, useCallback, useMemo, useRef, useId, useDeferredValue, memo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  FiBox, FiInfo, FiXCircle, FiSearch, FiX, FiCheck, FiTruck, FiFilter, FiChevronDown,
  FiChevronLeft, FiChevronRight, FiArrowLeft, FiRotateCcw, FiShoppingBag, FiClock,
} from 'react-icons/fi';
import api from '../common/api/api';
import queryClient from '../common/utils/queryClient';
import { authHeaders, useAuthGuard } from '../common/utils/auth';
import { useAppLanguage, languageDirection } from '../common/utils/useAppLanguage';
import { resolveImageSrc } from '../common/utils/productutils';
import { markImg, isImgOk, isImgBad } from '../common/utils/imageCache';
import enTranslations from '../locales/en/translation.json';
import arTranslations from '../locales/ar/translation.json';
import frTranslations from '../locales/fr/translation.json';
import { safeImageUrl } from '../components/user/ListingKit';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';

const HL_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 8' preserveAspectRatio='none'%3E%3Cpath d='M3 5Q50 1 100 4T197 4' fill='none' stroke='%2339ff88' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E")`;

const CSS = `
@font-face{font-family:'Poppins Fallback';src:local('Arial'),local('Helvetica');size-adjust:112.6%;ascent-override:93.4%;descent-override:35.2%;line-gap-override:7.4%}
.nb{--dx:1;--nb-bg:#ffffff;--nb-card:#ffffff;--nb-ink:#052e1e;--nb-muted:rgba(5,46,30,.68);--nb-line:#e5e7eb;--nb-line2:#000000;--nb-bd:#000000;--nb-shd:#000000;--nb-gray:#f3f4f6;--nb-accent:#059669;--nb-btn:#39ff88;--nb-btn2:#7dffb0;--nb-on:#022c22;--nb-ring:#059669;--nb-scrim:rgba(0,0,0,.6);
--nb-sh2:calc(var(--dx)*2px) 2px 0 0 var(--nb-shd);--nb-sh3:calc(var(--dx)*3px) 3px 0 0 var(--nb-shd);--nb-sh4:calc(var(--dx)*4px) 4px 0 0 var(--nb-shd);--nb-sh8:calc(var(--dx)*8px) 8px 0 0 var(--nb-shd);
background:var(--nb-bg);color:var(--nb-ink);color-scheme:light;font-family:'Poppins','Poppins Fallback',ui-sans-serif,system-ui,-apple-system,'Segoe UI','Cairo',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.nb[dir=rtl]{--dx:-1}
.nb-dark{--nb-bg:#141414;--nb-card:#1c1c1e;--nb-ink:#ffffff;--nb-muted:rgba(255,255,255,.66);--nb-line:rgba(255,255,255,.16);--nb-line2:rgba(255,255,255,.16);--nb-bd:rgba(255,255,255,.16);--nb-shd:#0b4a35;--nb-gray:#2a2a2e;--nb-accent:#39ff88;--nb-ring:#39ff88;--nb-scrim:rgba(0,0,0,.72);color-scheme:dark}
.nb[lang=ar]{font-family:'Cairo','Poppins',ui-sans-serif,system-ui,sans-serif}
.nb[lang=ar] *{letter-spacing:0!important}
.nb button,.nb input,.nb textarea{font-family:inherit}
.nb-gray{background:var(--nb-gray)}
.nb-muted{color:var(--nb-muted)}
.nb-ic{color:var(--nb-accent)}
.nb-line{border-color:var(--nb-line)}
.nb-bd{border-color:var(--nb-bd)}
.nb-hl{padding-bottom:.2em;background:${HL_URL} left bottom/100% .3em no-repeat;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.nb[dir=rtl] .nb-hl{background-position:right bottom}
.nb-card{background:var(--nb-card);border:3px solid var(--nb-bd);border-radius:16px;box-shadow:var(--nb-sh4)}
.nb-big{box-shadow:var(--nb-sh8)}
.nb-row{content-visibility:auto;contain-intrinsic-size:auto 280px}
.nb-band{background:var(--nb-btn);color:var(--nb-on);border-bottom:3px solid #000}
.nb-band .nb-muted{color:rgba(2,44,34,.72)}
.nb-chip{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;border:2px solid #000;border-radius:8px;background:var(--nb-btn);color:var(--nb-on)}
.nb-chip-bad{background:#fb7185;color:#000}
.nb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-bd);border-radius:12px;box-shadow:var(--nb-sh3);font-weight:700;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,background-color .15s ease,color .15s ease}
@media (hover:hover){.nb-btn:hover:not(:disabled){background:var(--nb-btn);color:var(--nb-on);border-color:#000;box-shadow:var(--nb-sh4);transform:translate3d(0,-1px,0)}}
.nb-btn:active:not(:disabled){transform:translate3d(0,2px,0);box-shadow:none}
.nb-btn:disabled{opacity:.45;cursor:not-allowed}
.nb-btn-a{background:var(--nb-btn);color:var(--nb-on);border:3px solid #000;box-shadow:var(--nb-sh4)}
@media (hover:hover){.nb-btn-a:hover:not(:disabled){background:var(--nb-btn2)}}
.nb-btn-d{background:#fb7185;color:#000;border:3px solid #000;box-shadow:var(--nb-sh4)}
@media (hover:hover){.nb-btn-d:hover:not(:disabled){background:#fda4af;color:#000}}
.nb-btn:focus-visible,.nb-focus:focus-visible,.nb-sel:focus-visible{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-field{background:var(--nb-card);color:var(--nb-ink);border:2px solid var(--nb-bd);border-radius:12px;box-shadow:var(--nb-sh3);transition:box-shadow .15s ease}
@media (hover:hover){.nb-field:hover{box-shadow:var(--nb-sh4)}}
.nb-field:focus-within{outline:3px solid var(--nb-ring);outline-offset:2px}
.nb-flip{display:inline-block}
[dir=rtl] .nb-flip{transform:scaleX(-1)}
.nb-chk{display:flex;width:100%;align-items:center;gap:10px;padding:7px 8px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}
.nb-chk:hover{background:var(--nb-gray)}
.nb-chk input{width:16px;height:16px;accent-color:var(--nb-accent)}
.nb-menu{background:var(--nb-card);color:var(--nb-ink);border:3px solid var(--nb-bd);border-radius:16px;box-shadow:var(--nb-sh4)}
.nb-opt{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;font-size:12px;font-weight:600;text-align:start;cursor:pointer}
.nb-opt-active{background:var(--nb-gray)}
.nb-opt[aria-selected=true]{background:var(--nb-btn);color:var(--nb-on)}
.nb-sk{background:linear-gradient(90deg,var(--nb-gray) 25%,color-mix(in srgb,var(--nb-gray) 45%,var(--nb-card)) 50%,var(--nb-gray) 75%);background-size:220% 100%;border-radius:8px;animation:nbShimmer 1.5s linear infinite}
@keyframes nbShimmer{from{background-position:120% 0}to{background-position:-120% 0}}
@keyframes nbPop{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}
.nb-pop{animation:nbPop .14s ease-out both;transform-origin:top}
@keyframes nbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.nb-float{animation:nbFloat 4s ease-in-out infinite}
.nb-float-2{animation:nbFloat 5s ease-in-out .6s infinite}
@keyframes nbIn{from{opacity:0;transform:translate3d(0,10px,0)}to{opacity:1;transform:none}}
.nb-in{animation:nbIn .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0)*40ms)}
@keyframes mdlFade{from{opacity:0}to{opacity:1}}
@keyframes mdlPop{from{opacity:0;transform:translate3d(0,14px,0) scale(.97)}to{opacity:1;transform:none}}
.mdl-overlay{animation:mdlFade .14s ease-out both}
.mdl-panel{animation:mdlPop .18s cubic-bezier(.16,1,.3,1) both}
@media (prefers-reduced-motion:reduce){.nb-in,.mdl-overlay,.mdl-panel,.nb-pop,.nb-float,.nb-float-2,.nb-sk{animation:none!important}.nb-btn,.nb-field{transition:none}.nb-btn:hover:not(:disabled){transform:none}}
`;

if (typeof document !== 'undefined' && !document.querySelector('style[data-myorders-styles]')) {
  const tag = document.createElement('style');
  tag.setAttribute('data-myorders-styles', 'true');
  tag.textContent = `${EXTRAS_CSS}${CSS}`;
  document.head.appendChild(tag);
}

const shouldRetry = (n, err) => n < 2 && ![400, 401, 403, 404].includes(err?.response?.status);

const POLL_MS = 20_000;
const PER_PAGE = 6;
const ID_RE = /^[\w-]{1,64}$/;
const ACCOUNT_TR = { en: enTranslations.account, ar: arTranslations.account, fr: frTranslations.account };
const tr = (lang, key, fallback) => ACCOUNT_TR[lang]?.[key] || ACCOUNT_TR.en?.[key] || fallback || key;

const ORDER_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'FINISHPROCESSING', 'SHIPPED', 'DELIVERED'];
const ORDER_STATUSES = [...ORDER_STEPS, 'CANCELLED'];
const FINAL = new Set(['DELIVERED', 'CANCELLED']);
const TONES = { DELIVERED: 'bg-[#39ff88]', CANCELLED: 'bg-rose-500' };
const PERIODS = [['all', 'All time', 0], ['3m', 'Last 3 months', 3], ['6m', 'Last 6 months', 6], ['12m', 'Last 12 months', 12]];
const SORTS = [['newest', 'Newest first'], ['oldest', 'Oldest first'], ['price_desc', 'Highest price'], ['price_asc', 'Lowest price']];
const PERIOD_OPTIONS = PERIODS.map(([value, label]) => ({ value, label }));
const SORT_OPTIONS = SORTS.map(([value, label]) => ({ value, label }));
const MONTH_MS = 30.44 * 24 * 3600 * 1000;
const SK_ROWS = [0, 1, 2];
const STAGGER = Array.from({ length: PER_PAGE }, (_, i) => ({ '--i': i }));
const QUERY_OPTS = { refetchOnWindowFocus: false };

const EMPTY_MAP = {};
const EMPTY_LIST = [];
const IMAGE_FIELDS = ['imageUrl', 'productImageUrl', 'productImage', 'image', 'thumbnailUrl', 'imagePath'];
const ABSOLUTE_HTTP = /^https?:\/\//i;
const isSafeSrc = (v) => ABSOLUTE_HTTP.test(v) || (v.startsWith('/') && !v.startsWith('//'));

const toSafeSrc = (value) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw || raw.length > 2048 || raw.includes('..') || /[\u0000-\u001f]/.test(raw)) return null;
  const direct = safeImageUrl(raw);
  if (direct && isSafeSrc(String(direct))) return String(direct);
  const path = ABSOLUTE_HTTP.test(raw) || raw.startsWith('/') ? raw : `/${raw}`;
  const resolved = resolveImageSrc(path) || path;
  return isSafeSrc(String(resolved)) ? String(resolved) : null;
};

const pickItemImage = (item) => {
  const nested = item?.product || EMPTY_MAP;
  const arrays = [item?.imageUrls, nested.imageUrls].find(Array.isArray) || [];
  const candidates = [...IMAGE_FIELDS.map((k) => item?.[k]), ...IMAGE_FIELDS.map((k) => nested[k]), ...arrays];
  for (const c of candidates) {
    const src = toSafeSrc(c);
    if (src) return src;
  }
  return null;
};

const productIdOf = (item) => {
  const id = item?.productId ?? item?.product?.id;
  return id == null ? '' : String(id);
};

const enrichOrder = (order, imageMap) => {
  const items = Array.isArray(order.orderItems) ? order.orderItems : EMPTY_LIST;
  return { ...order, orderItems: items.map((it) => ({ ...it, _img: pickItemImage(it) || imageMap[productIdOf(it)] || null })) };
};

const unwrap = (res) => {
  const d = res.data?.content ?? res.data ?? [];
  return Array.isArray(d) ? d : [];
};

const friendlyError = (err, fallback) => {
  const status = err?.response?.status;
  const raw = String(err?.response?.data?.message || '');
  if (/order not found/i.test(raw) || status === 404) return 'We could not find this order. Please refresh and try again.';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return 'You are not allowed to perform this action.';
  return fallback;
};

const fmtShortIntl = new Intl.DateTimeFormat('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtFullIntl = new Intl.DateTimeFormat('en-EG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Cairo' });
const formatWith = (fmt) => (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : fmt.format(d);
};
const fmtShort = formatWith(fmtShortIntl);
const fmtFull = formatWith(fmtFullIntl);
const ts = (x) => Date.parse(x.createdAt) || 0;
const round2 = (n) => Math.round(n * 100) / 100;
const hasValue = (v) => v != null && !(typeof v === 'string' && v.trim() === '') && v !== 0;
const humanize = (s) => String(s || '').toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const progressOf = (status) => {
  if (status === 'CANCELLED') return -1;
  const i = ORDER_STEPS.indexOf(status);
  return i < 0 ? 0 : Math.round((i / (ORDER_STEPS.length - 1)) * 100);
};

const IconTile = memo(({ Icon, className = 'h-9 w-9', iconClassName = 'h-4 w-4' }) => (
  <span aria-hidden="true" className={`nb-chip !rounded-xl ${className}`}>
    <Icon className={iconClassName} />
  </span>
));

const Sk = ({ className = '' }) => <div aria-hidden="true" className={`nb-sk ${className}`} />;

const Btn = ({ tone, className = '', children, ...rest }) => (
  <button type="button" className={`nb-btn ${tone === 'danger' ? 'nb-btn-d' : tone === 'soft' ? '' : 'nb-btn-a'} ${className}`} {...rest}>{children}</button>
);

const StatusLabel = memo(({ status, t }) => (
  <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border-2 border-black bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-950">
    <span aria-hidden="true" className={`h-2 w-2 rounded-full ring-1 ring-black/40 ${TONES[status] || 'bg-amber-400'}`} />
    {t(`status_${status}`, humanize(status))}
  </span>
));

const ProgressBar = memo(({ progress, label }) => {
  const bad = progress < 0;
  const pct = bad ? 100 : progress;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-semibold">
        <span className="truncate">{label}</span>
        {!bad && <span dir="ltr" className="nb-muted tabular-nums">{pct}%</span>}
      </div>
      <div className="nb-gray nb-bd h-3 overflow-hidden rounded-full border-2">
        <div
          className={`h-full w-full origin-left rounded-full transition-transform duration-500 ease-out rtl:origin-right motion-reduce:transition-none ${bad ? 'bg-rose-500' : 'bg-[#39ff88]'}`}
          style={{ transform: `scaleX(${pct / 100})` }}
        />
      </div>
    </div>
  );
});

const ItemThumb = memo(({ src, name, ratio = 'aspect-square' }) => {
  const imgRef = useRef(null);
  const [failed, setFailed] = useState(() => isImgBad(src));
  const [loaded, setLoaded] = useState(() => isImgOk(src));

  useEffect(() => {
    setFailed(isImgBad(src));
    setLoaded(isImgOk(src));
  }, [src]);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      markImg(src, 'ok');
      setLoaded(true);
    }
  }, [src, failed]);

  const onError = useCallback(() => { markImg(src, 'bad'); setFailed(true); }, [src]);
  const onLoad = useCallback(() => { markImg(src, 'ok'); setLoaded(true); }, [src]);

  return (
    <div className={`relative w-full overflow-hidden bg-white [contain:layout_paint] ${ratio}`}>
      {src && !failed ? (
        <>
          {!loaded && <div aria-hidden="true" className="nb-sk absolute inset-0 !rounded-none" />}
          <img
            ref={imgRef} src={src} alt={name || ''} width={400} height={300} loading="lazy" decoding="async"
            fetchPriority="low" referrerPolicy="no-referrer" onLoad={onLoad} onError={onError}
            className={`absolute inset-0 h-full w-full bg-white object-contain p-1.5 transition-opacity duration-300 motion-reduce:transition-none ${loaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : (
        <div aria-hidden="true" className="nb-gray nb-ic absolute inset-0 flex items-center justify-center">
          <FiBox className="h-1/3 w-1/3" />
        </div>
      )}
    </div>
  );
});

const ItemThumbButton = memo(({ item, onPreview, className = '' }) => {
  const open = useCallback(() => onPreview(item), [onPreview, item]);
  return (
    <button type="button" onClick={open} aria-label={`Preview image: ${item.productName || ''}`}
      className={`nb-focus nb-bd relative flex-shrink-0 cursor-zoom-in overflow-hidden rounded-xl border-2 bg-white ${className}`}>
      <ItemThumb src={item._img} name={item.productName} />
    </button>
  );
});

const ModalFrame = ({ onClose, size = 'sm:max-w-lg', label, role = 'dialog', children }) => {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current?.(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="mdl-overlay absolute inset-0 bg-[color:var(--nb-scrim)]" onClick={onClose} aria-hidden="true" />
      <div ref={panelRef} tabIndex={-1} role={role} aria-modal="true" aria-label={label}
        className={`nb-card nb-big mdl-panel relative flex max-h-[92vh] w-full flex-col overflow-hidden !rounded-b-none outline-none sm:!rounded-2xl ${size}`}>
        {children}
      </div>
    </div>
  );
};

const Sheet = ({ onClose, title, subtitle, size, footer, children }) => (
  <ModalFrame onClose={onClose} size={size} label={title}>
    <header className="nb-band flex flex-shrink-0 items-center gap-3 px-4 py-3.5 sm:px-5">
      <span aria-hidden="true" className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-black bg-white text-emerald-950"><FiBox className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-bold">{title}</h2>
        {subtitle && <p className="nb-muted mt-0.5 truncate text-[11px] font-semibold">{subtitle}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="nb-btn h-9 w-9 flex-shrink-0 !bg-white !text-emerald-950"><FiX className="h-4 w-4" /></button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">{children}</div>
    {footer && <footer className="nb-line flex-shrink-0 border-t-2 px-4 py-3.5 sm:px-5">{footer}</footer>}
  </ModalFrame>
);

const ConfirmDialog = memo(({ dlg, onSettle, onClose }) => (
  <ModalFrame onClose={onClose} size="sm:max-w-md" label={dlg.title} role="alertdialog">
    <div className="px-6 pb-6 pt-8 text-center">
      <span aria-hidden="true" className="nb-chip nb-chip-bad mx-auto h-16 w-16 !rounded-full"><FiXCircle className="h-7 w-7" /></span>
      <h2 className="mt-4 text-xl font-bold">{dlg.title}</h2>
      <p className="nb-muted mx-auto mt-3 max-w-xs text-sm font-normal leading-relaxed">{dlg.text}</p>
    </div>
    <div className="nb-gray nb-line grid grid-cols-2 gap-3 border-t-2 px-5 py-4">
      <Btn tone="soft" onClick={onClose} className="py-3 text-sm">{dlg.cancelText}</Btn>
      <Btn tone="danger" onClick={() => { onSettle(true); onClose(); }} className="py-3 text-sm">{dlg.confirmText}</Btn>
    </div>
  </ModalFrame>
));

const useConfirmDialog = () => {
  const [dlg, setDlg] = useState(null);
  const resolver = useRef(null);
  const ask = useCallback((opts) => new Promise((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setDlg(opts);
  }), []);
  const settle = useCallback((v) => { resolver.current?.(v); resolver.current = null; }, []);
  const close = useCallback(() => { settle(false); setDlg(null); }, [settle]);
  return { dlg, ask, settle, close };
};

const Pagination = memo(({ page, total, onChange, t }) => {
  if (total <= 1) return null;
  const nums = [...new Set([1, total, page - 1, page, page + 1])].filter((x) => x >= 1 && x <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((x, i) => { if (i && x - nums[i - 1] > 1) out.push(`gap-${x}`); out.push(x); });
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-3 pt-8">
      <button type="button" className="nb-btn h-10 w-10" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('prevPage', 'Previous page')}><FiChevronLeft className="nb-flip h-4 w-4" /></button>
      {out.map((x) => (typeof x === 'number' ? (
        <button key={x} type="button" onClick={() => onChange(x)} aria-label={`${t('page', 'Page')} ${x}`} aria-current={x === page ? 'page' : undefined}
          className={`nb-btn h-10 min-w-[2.5rem] px-2 text-sm tabular-nums ${x === page ? 'nb-btn-a' : ''}`}>{x}</button>
      ) : <span key={x} aria-hidden="true" className="nb-muted px-1 font-bold">…</span>))}
      <button type="button" className="nb-btn h-10 w-10" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={t('nextPage', 'Next page')}><FiChevronRight className="nb-flip h-4 w-4" /></button>
    </nav>
  );
});

const MetaCell = ({ label, children }) => (
  <div className="min-w-0">
    <p className="nb-muted text-[11px] font-semibold">{label}</p>
    <p className="mt-0.5 truncate text-sm font-bold">{children}</p>
  </div>
);

const OrderRow = memo(({ order, index, t, onDetails, onCancel, onPreview }) => {
  const items = order.orderItems || EMPTY_LIST;
  const count = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0) || items.length;
  const canCancel = !FINAL.has(order.status);
  const payment = hasValue(order.paymentMethod) ? String(order.paymentMethod).replace('_', ' ') : '—';
  const shown = items.slice(0, 4);
  const extra = items.length - shown.length;
  return (
    <article style={STAGGER[index % PER_PAGE]} className="nb-in nb-card nb-row overflow-hidden">
      <div className="nb-band flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 flex-wrap gap-x-8 gap-y-2">
          <MetaCell label={t('orderPlaced', 'Order placed')}>{hasValue(order.createdAt) ? fmtShort(order.createdAt) : '—'}</MetaCell>
          <MetaCell label={t('total', 'Total')}><span dir="ltr">{hasValue(order.totalPrice) ? `EGP ${order.totalPrice}` : '—'}</span></MetaCell>
          <MetaCell label={t('paymentMethod', 'Payment method')}>{payment}</MetaCell>
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5 sm:items-end">
          <p dir="ltr" className="truncate text-xs font-bold tabular-nums">ORD #{String(order.id).slice(0, 8).toUpperCase()}</p>
          <StatusLabel status={order.status} t={t} />
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <ul className="grid gap-3 sm:grid-cols-2">
          {shown.map((it, i) => (
            <li key={it.id ?? i} className="flex items-center gap-3">
              <ItemThumbButton item={it} onPreview={onPreview} className="w-16" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold leading-snug">{it.productName || '—'}</p>
                <p className="nb-muted truncate text-xs font-medium">{it.shopName || '—'}</p>
                <p dir="ltr" className="nb-muted text-xs font-medium rtl:text-end">{it.quantity} × EGP {Number(it.priceAtCheckout || 0).toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>
        {extra > 0 && <p dir="ltr" className="nb-muted text-xs font-semibold rtl:text-end">+{extra} {t('items', 'items')}</p>}

        <ProgressBar progress={progressOf(order.status)} label={t(`status_${order.status}`, humanize(order.status))} />

        <div className="nb-line flex flex-wrap items-center justify-between gap-3 border-t-2 pt-4">
          <p className="nb-muted text-xs font-medium"><span dir="ltr">{count}</span> {t('items', 'items')}</p>
          <div className="flex flex-wrap gap-2">
            <Btn tone="soft" onClick={() => onDetails(order)} className="min-h-9 px-3.5 py-2 text-xs"><FiInfo className="h-3.5 w-3.5" /> {t('details', 'Details')}</Btn>
            {canCancel && <Btn tone="danger" onClick={() => onCancel(order.id)} className="min-h-9 px-3.5 py-2 text-xs"><FiXCircle className="h-3.5 w-3.5" /> {t('cancelOrder', 'Cancel order')}</Btn>}
          </div>
        </div>
      </div>
    </article>
  );
});

const NbDropdown = memo(({ value, onChange, options, ariaLabel, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();
  const listId = `${uid}-list`;
  const selectedIdx = options.findIndex((o) => o.value === value);
  const current = options[selectedIdx];

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setIsOpen(false); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [isOpen]);

  useEffect(() => { if (isOpen) setActive(Math.max(0, selectedIdx)); }, [isOpen, selectedIdx]);
  useEffect(() => { if (isOpen) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [isOpen, active]);

  const choose = (i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setIsOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e) => {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.min(i + 1, last)); break;
      case 'ArrowUp': e.preventDefault(); if (!isOpen) setIsOpen(true); else setActive((i) => Math.max(i - 1, 0)); break;
      case 'Home': if (isOpen) { e.preventDefault(); setActive(0); } break;
      case 'End': if (isOpen) { e.preventDefault(); setActive(last); } break;
      case 'Enter': case ' ': e.preventDefault(); if (isOpen) choose(active); else setIsOpen(true); break;
      case 'Escape': if (isOpen) { e.preventDefault(); e.stopPropagation(); setIsOpen(false); } break;
      case 'Tab': setIsOpen(false); break;
      default:
    }
  };

  return (
    <div ref={rootRef} className={`relative ${isOpen ? 'z-30' : ''} ${className}`}>
      <button
        ref={btnRef} type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listId}
        aria-activedescendant={isOpen ? `${uid}-o${active}` : undefined}
        onClick={() => setIsOpen((o) => !o)} onKeyDown={onKeyDown}
        className="nb-field nb-sel flex h-10 w-full cursor-pointer items-center justify-between gap-2 ps-3 pe-3 text-start text-xs font-semibold"
      >
        <span className="truncate">{current ? current.label : ''}</span>
        <FiChevronDown aria-hidden="true" className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <ul
          ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} tabIndex={-1}
          className="nb-menu nb-pop absolute start-0 top-full z-30 mt-3 max-h-64 min-w-full overflow-y-auto overscroll-contain py-1"
        >
          {options.map((o, i) => (
            <li
              key={o.value} id={`${uid}-o${i}`} role="option" aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)} onClick={() => choose(i)}
              className={`nb-opt whitespace-nowrap ${i === active ? 'nb-opt-active' : ''}`}
            >
              <span>{o.label}</span>
              {o.value === value && <FiCheck aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

const EmptyIllustration = memo(({ searching }) => (
  <svg viewBox="0 0 320 240" className="h-48 w-auto sm:h-56" role="img" aria-hidden="true" fill="none">
    <ellipse cx="160" cy="205" rx="92" ry="12" fill="var(--nb-line)" />
    <circle cx="160" cy="112" r="88" fill="var(--nb-gray)" />
    <g className="nb-float">
      <path d="M92 118 160 94l68 24v62l-68 24-68-24z" fill="var(--nb-card)" stroke="var(--nb-bd)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M92 118 160 142l68-24" stroke="var(--nb-bd)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M160 142v62" stroke="var(--nb-bd)" strokeWidth="2" />
      <path d="M92 118 126 100l68 24-34 18z" fill="var(--nb-gray)" stroke="var(--nb-bd)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M228 118 194 100 160 112" stroke="var(--nb-bd)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M138 152l22 8 22-8v22l-22 8-22-8z" fill="var(--nb-btn)" />
      <path d="M144 158l16 6 16-6" stroke="var(--nb-on)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    {searching ? (
      <g className="nb-float-2">
        <circle cx="236" cy="70" r="26" fill="var(--nb-card)" stroke="var(--nb-accent)" strokeWidth="5" />
        <path d="m255 90 20 20" stroke="var(--nb-accent)" strokeWidth="8" strokeLinecap="round" />
        <path d="m228 62 16 16m0-16-16 16" stroke="var(--nb-accent)" strokeWidth="4" strokeLinecap="round" />
      </g>
    ) : (
      <g className="nb-float-2">
        <rect x="204" y="44" width="76" height="46" rx="14" fill="var(--nb-btn)" stroke="#000" strokeWidth="3" />
        <path d="M222 90v16l16-16z" fill="var(--nb-btn)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="228" cy="64" r="4" fill="var(--nb-on)" />
        <circle cx="256" cy="64" r="4" fill="var(--nb-on)" />
        <path d="M232 79q12-9 24 0" stroke="var(--nb-on)" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    )}
    <circle cx="70" cy="64" r="6" fill="var(--nb-btn)" />
    <circle cx="48" cy="140" r="4" fill="var(--nb-bd)" />
    <circle cx="276" cy="168" r="5" fill="var(--nb-btn)" />
    <path d="M82 36v14M75 43h14" stroke="var(--nb-accent)" strokeWidth="3" strokeLinecap="round" />
    <path d="M262 132v10M257 137h10" stroke="var(--nb-bd)" strokeWidth="3" strokeLinecap="round" />
  </svg>
));

const FilterPanel = memo(({ filters, setFilters, counts, resultCount, active, onReset, t }) => {
  const uid = useId();
  const { search, period, statuses, sort } = filters;
  const toggle = (s) => setFilters((f) => ({ ...f, statuses: f.statuses.includes(s) ? f.statuses.filter((x) => x !== s) : [...f.statuses, s] }));
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const setField = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const label = 'mb-1.5 block text-xs font-bold';
  return (
    <div className="nb-card flex flex-col gap-5 p-4">
      <div>
        <label htmlFor={`${uid}-s`} className={label}>{t('search', 'Search')}</label>
        <div className="nb-field flex h-10 items-center gap-2 px-3">
          <FiSearch aria-hidden="true" className="nb-ic h-4 w-4 flex-shrink-0" />
          <input id={`${uid}-s`} type="search" value={search} maxLength={60} autoComplete="off" onChange={set('search')} placeholder={t('searchProducts', 'Search products or order ID')}
            className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:opacity-70 sm:text-sm" />
        </div>
      </div>
      <div>
        <p className={label}>{t('period', 'Period')}</p>
        <NbDropdown value={period} onChange={setField('period')} options={PERIOD_OPTIONS} ariaLabel={t('period', 'Period')} />
      </div>
      <div>
        <p className={label}>{t('sortBy', 'Sort by')}</p>
        <NbDropdown value={sort} onChange={setField('sort')} options={SORT_OPTIONS} ariaLabel={t('sortBy', 'Sort by')} />
      </div>
      <fieldset>
        <legend className={label}>{t('status', 'Status')}</legend>
        <div className="space-y-0.5">
          {ORDER_STATUSES.map((s) => (
            <label key={s} className="nb-chk">
              <input type="checkbox" checked={statuses.includes(s)} onChange={() => toggle(s)} />
              <span className="flex-1 truncate">{t(`status_${s}`, humanize(s))}</span>
              <span dir="ltr" className="nb-muted tabular-nums">{counts[s] || 0}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="nb-line flex items-center justify-between gap-3 border-t-2 pt-3">
        <p className="nb-muted text-[11px] font-semibold" aria-live="polite">{resultCount} result{resultCount === 1 ? '' : 's'}</p>
        {active && <Btn tone="soft" onClick={onReset} className="h-9 px-3 text-xs"><FiRotateCcw className="h-3.5 w-3.5" /> {t('clear', 'Clear')}</Btn>}
      </div>
    </div>
  );
});

const OrderModal = memo(({ order, onClose, onPreview, t }) => {
  const items = order.orderItems || EMPTY_LIST;
  return (
    <Sheet onClose={onClose} size="sm:max-w-2xl" title={`ORD #${String(order.id).slice(0, 8).toUpperCase()}`}
      subtitle={hasValue(order.createdAt) ? fmtFull(order.createdAt) : undefined}
      footer={<div className="flex justify-end"><Btn tone="soft" onClick={onClose} className="px-6 py-2 text-sm">{t('close', 'Close')}</Btn></div>}>
      <div className="space-y-4">
        <section className="nb-gray nb-line rounded-2xl border-2 p-3.5">
          <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold">
            <IconTile Icon={FiTruck} className="h-7 w-7" iconClassName="h-3.5 w-3.5" />
            <span className="min-w-0 flex-1 truncate">{t('status', 'Status')}</span>
            <StatusLabel status={order.status} t={t} />
          </h3>
          <ProgressBar progress={progressOf(order.status)} label={t(`status_${order.status}`, humanize(order.status))} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {hasValue(order.createdAt) && (
              <div className="nb-line min-w-0 rounded-xl border-2 bg-[color:var(--nb-card)] px-2.5 py-1.5">
                <p className="nb-muted text-[11px] font-semibold">{t('orderDate', 'Order date')}</p>
                <p className="truncate text-sm font-bold">{fmtFull(order.createdAt)}</p>
              </div>
            )}
            {hasValue(order.paymentMethod) && (
              <div className="nb-line min-w-0 rounded-xl border-2 bg-[color:var(--nb-card)] px-2.5 py-1.5">
                <p className="nb-muted text-[11px] font-semibold">{t('paymentMethod', 'Payment method')}</p>
                <p className="truncate text-sm font-bold">{String(order.paymentMethod).replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </section>
        <section className="nb-gray nb-line rounded-2xl border-2 p-3.5">
          <h3 className="mb-3 flex items-center gap-2.5 text-xs font-bold">
            <IconTile Icon={FiBox} className="h-7 w-7" iconClassName="h-3.5 w-3.5" />
            <span className="min-w-0 flex-1 truncate">{t('orderItems', 'Order items')}</span>
          </h3>
          <ul className="nb-line divide-y-2 divide-[color:var(--nb-line)] overflow-hidden rounded-xl border-2 bg-[color:var(--nb-card)]">
            {items.length === 0 ? <li className="nb-muted p-8 text-center text-sm">{t('noItems', 'No items')}</li> : items.map((it, i) => (
              <li key={it.id ?? i} className="flex items-center gap-3 p-3">
                <ItemThumbButton item={it} onPreview={onPreview} className="w-16" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold leading-snug">{it.productName || '—'}</p>
                  <p className="nb-muted truncate text-xs font-medium">{it.shopName || '—'} · <span dir="ltr">{it.quantity} × EGP {Number(it.priceAtCheckout || 0).toFixed(2)}</span></p>
                </div>
                <b dir="ltr" className="flex-shrink-0 text-sm font-bold tabular-nums">EGP {round2((Number(it.priceAtCheckout) || 0) * (Number(it.quantity) || 0)).toFixed(2)}</b>
              </li>
            ))}
            <li className="nb-gray flex items-center justify-between p-3">
              <span className="text-xs font-bold">{t('grandTotal', 'Grand total')}</span>
              <b dir="ltr" className="text-lg font-bold tabular-nums">EGP {order.totalPrice ?? '—'}</b>
            </li>
          </ul>
        </section>
      </div>
    </Sheet>
  );
});

const ItemPreview = memo(({ item, onClose, t }) => (
  <Sheet onClose={onClose} size="sm:max-w-lg" title={item.productName || '—'} subtitle={`${item.quantity ?? 1} × EGP ${Number(item.priceAtCheckout || 0).toFixed(2)}`}
    footer={<div className="flex justify-end"><Btn tone="soft" onClick={onClose} className="px-6 py-2 text-sm">{t('close', 'Close')}</Btn></div>}>
    <div className="nb-bd overflow-hidden rounded-2xl border-2">
      <ItemThumb src={item._img} name={item.productName} ratio="aspect-[4/3]" />
    </div>
  </Sheet>
));

const StatCard = memo(({ Icon, label, value, index }) => (
  <li style={STAGGER[index]} className="nb-in nb-card flex min-w-0 items-center gap-3 px-3.5 py-3">
    <IconTile Icon={Icon} className="h-10 w-10" iconClassName="h-5 w-5" />
    <div className="min-w-0">
      <p className="nb-muted truncate text-[11px] font-semibold">{label}</p>
      <p dir="ltr" className="text-xl font-bold leading-tight tabular-nums rtl:text-end">{value}</p>
    </div>
  </li>
));

const StatsSkeleton = memo(() => (
  <div className="grid grid-cols-3 gap-3" aria-hidden="true">
    {[0, 1, 2].map((i) => (
      <div key={i} className="nb-card flex items-center gap-3 px-3.5 py-3">
        <Sk className="h-10 w-10 flex-none !rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2"><Sk className="h-3 w-2/3" /><Sk className="h-5 w-1/3" /></div>
      </div>
    ))}
  </div>
));

const OrderSkeleton = memo(() => (
  <div className="nb-card overflow-hidden">
    <div className="nb-band flex h-[68px] flex-wrap items-center justify-between gap-4 px-5 py-3">
      <div className="flex gap-8"><Sk className="h-8 w-24 !bg-black/10" /><Sk className="h-8 w-20 !bg-black/10" /><Sk className="hidden h-8 w-24 !bg-black/10 sm:block" /></div>
      <Sk className="h-8 w-28 !bg-black/10" />
    </div>
    <div className="space-y-4 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Sk className="h-16 w-16 flex-none !rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2"><Sk className="h-4 w-4/5" /><Sk className="h-3 w-1/2" /><Sk className="h-3 w-1/3" /></div>
          </div>
        ))}
      </div>
      <Sk className="h-6 w-full" />
      <div className="flex justify-end gap-2"><Sk className="h-9 w-24" /><Sk className="h-9 w-28" /></div>
    </div>
  </div>
));

const ListSkeleton = memo(() => (
  <div className="space-y-4" aria-busy="true" role="status" aria-label="Loading">
    {SK_ROWS.map((i) => <OrderSkeleton key={i} />)}
  </div>
));

const INITIAL_FILTERS = { search: '', period: 'all', statuses: [], sort: 'newest' };

const MyOrdersContent = ({ darkMode = false }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const language = useAppLanguage();
  const t = useCallback((k, fallback) => tr(language, k, fallback), [language]);
  const { dlg, ask, settle, close: closeConfirm } = useConfirmDialog();
  const token = useAuthGuard();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const cancellingRef = useRef(new Set());
  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => { document.title = 'My Orders | Tech-Restore'; }, []);

  const cfg = useMemo(() => ({ headers: authHeaders() }), [token]);

  const { data: orders = EMPTY_LIST, isLoading, isError, refetch } = useQuery({
    ...QUERY_OPTS,
    queryKey: ['orders'],
    queryFn: async ({ signal }) => unwrap(await api.get('/api/users/orders', { ...cfg, signal })),
    enabled: !!token,
    staleTime: 30_000,
    retry: shouldRetry,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });

  const { data: imageMap = EMPTY_MAP } = useQuery({
    ...QUERY_OPTS,
    queryKey: ['productImages'],
    queryFn: async ({ signal }) => {
      const res = await api.get('/api/products', { ...cfg, signal });
      const list = res.data?.content || res.data || [];
      const map = {};
      if (!Array.isArray(list)) return map;
      for (const p of list) {
        if (!p || p.id == null) continue;
        const src = toSafeSrc(p.imageUrl);
        if (src) map[String(p.id)] = src;
      }
      return map;
    },
    enabled: !!token && orders.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const enriched = useMemo(() => orders.map((o) => enrichOrder(o, imageMap)), [orders, imageMap]);

  const counts = useMemo(() => {
    const m = {};
    enriched.forEach((o) => { m[o.status] = (m[o.status] || 0) + 1; });
    return m;
  }, [enriched]);

  const inProgress = useMemo(() => enriched.reduce((n, o) => n + (FINAL.has(o.status) ? 0 : 1), 0), [enriched]);

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    const months = PERIODS.find((p) => p[0] === filters.period)?.[2] || 0;
    const cutoff = months ? Date.now() - months * MONTH_MS : 0;
    const price = (x) => Number(x.totalPrice) || 0;
    const list = enriched.filter((o) => (
      (!filters.statuses.length || filters.statuses.includes(o.status))
      && (!cutoff || ts(o) >= cutoff)
      && (!term || String(o.id).toLowerCase().includes(term) || (o.orderItems || []).some((i) => String(i.productName || '').toLowerCase().includes(term)))
    ));
    const sorters = {
      oldest: (a, b) => ts(a) - ts(b),
      price_desc: (a, b) => price(b) - price(a),
      price_asc: (a, b) => price(a) - price(b),
      newest: (a, b) => ts(b) - ts(a),
    };
    return list.sort(sorters[filters.sort] || sorters.newest);
  }, [enriched, deferredSearch, filters.period, filters.statuses, filters.sort]);

  useEffect(() => { setPage(1); }, [deferredSearch, filters.period, filters.statuses, filters.sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const pageItems = useMemo(() => filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE), [filtered, current]);
  const active = filters.search !== '' || filters.period !== 'all' || filters.statuses.length > 0 || filters.sort !== 'newest';
  const reset = useCallback(() => setFilters(INITIAL_FILTERS), []);
  const selectedOrder = useMemo(() => (selectedId ? enriched.find((o) => o.id === selectedId) || null : null), [selectedId, enriched]);
  const loading = isLoading || !token;

  const cancelOrder = useCallback(async (id) => {
    if (!ID_RE.test(String(id)) || cancellingRef.current.has(id)) return;
    cancellingRef.current.add(id);
    try {
      const ok = await ask({
        title: t('cancelOrderTitle', 'Cancel order?'), text: 'The order will be cancelled and this cannot be undone.',
        confirmText: 'Yes, cancel order', cancelText: 'Keep order',
      });
      if (!ok) return;
      try {
        await api.delete(`/api/users/orders/${encodeURIComponent(id)}/cancel`, cfg);
        qc.setQueryData(['orders'], (o = []) => o.map((x) => (x.id === id ? { ...x, status: 'CANCELLED' } : x)));
        toast({ icon: 'success', title: 'Order cancelled', timer: 2500 });
      } catch (err) {
        toast({ icon: 'error', title: friendlyError(err, "We couldn't cancel this order. Please try again."), timer: 3500 });
      } finally {
        qc.invalidateQueries({ queryKey: ['orders'] });
      }
    } finally { cancellingRef.current.delete(id); }
  }, [ask, t, cfg, qc]);

  const openDetails = useCallback((o) => setSelectedId(o.id), []);
  const closeDetails = useCallback(() => setSelectedId(null), []);
  const openPreview = useCallback((item) => setPreviewItem(item), []);
  const closePreview = useCallback(() => setPreviewItem(null), []);
  const goBack = useCallback(() => navigate('/account'), [navigate]);
  const goShop = useCallback(() => navigate('/devices'), [navigate]);
  const toggleFilters = useCallback(() => setFiltersOpen((v) => !v), []);

  const filterPanel = (
    <FilterPanel filters={filters} setFilters={setFilters} counts={counts} resultCount={filtered.length} active={active} onReset={reset} t={t} />
  );

  let content;
  if (loading) content = <ListSkeleton />;
  else if (isError) {
    content = (
      <div className="nb-dot flex flex-col items-center gap-3 rounded-2xl border-[3px] border-dashed border-[color:var(--nb-line2)] bg-[color:var(--nb-card)] px-4 py-14 text-center" role="alert">
        <p className="text-lg font-bold">Could not load your orders</p>
        <p className="nb-muted max-w-sm text-sm font-normal">Check your connection and try again.</p>
        <Btn onClick={() => refetch()} className="px-4 py-2 text-sm"><FiRotateCcw className="h-4 w-4" /> Try again</Btn>
      </div>
    );
  } else if (filtered.length === 0) {
    content = (
      <div className="nb-in flex flex-col items-center gap-3 rounded-2xl border-[3px] border-dashed border-[color:var(--nb-line2)] bg-[color:var(--nb-card)] px-4 py-12 text-center">
        <EmptyIllustration searching={active} />
        <p className="text-lg font-bold">{active ? 'No orders match these filters' : t('noOrders', 'No orders yet')}</p>
        <p className="nb-muted max-w-sm text-sm font-normal">{active ? 'Try a different period or clear the filters.' : t('ordersHint', 'Your orders will show up here once you place one.')}</p>
        {active
          ? <Btn tone="soft" onClick={reset} className="px-4 py-2 text-sm"><FiRotateCcw className="h-4 w-4" /> {t('clear', 'Clear')}</Btn>
          : <Btn onClick={goShop} className="px-5 py-2.5 text-sm"><FiShoppingBag className="h-4 w-4" /> {t('startShopping', 'Start shopping')}</Btn>}
      </div>
    );
  } else {
    content = (
      <>
        <div className="space-y-6">
          {pageItems.map((o, i) => <OrderRow key={o.id} order={o} index={i} t={t} onDetails={openDetails} onCancel={cancelOrder} onPreview={openPreview} />)}
        </div>
        <Pagination page={current} total={totalPages} onChange={setPage} t={t} />
      </>
    );
  }

  return (
    <div dir={languageDirection(language)} lang={language} className={`nb ${darkMode ? 'nb-dark' : ''} min-h-screen overflow-x-clip`}>
      <Toaster darkMode={darkMode} />
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-36 sm:px-6 md:pb-14 md:pt-32 lg:px-8">
        <header className="mb-8 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <button type="button" onClick={goBack} className="nb-focus nb-muted mb-2 flex items-center gap-1.5 rounded text-xs font-semibold hover:underline">
                <FiArrowLeft className="nb-flip h-3.5 w-3.5" /> {t('myAccount', 'My account')}
              </button>
              <h1 className="text-2xl font-bold tracking-tight rtl:tracking-normal sm:text-3xl"><span className="nb-hl">{t('orders', 'Orders')}</span></h1>
            </div>
            <Btn tone="soft" onClick={toggleFilters} aria-expanded={filtersOpen} aria-controls="orders-filters" className="h-10 px-3 text-xs lg:hidden">
              <FiFilter className="h-3.5 w-3.5" /> {t('filters', 'Filters')}{active ? ' •' : ''}
            </Btn>
          </div>
          {loading ? <StatsSkeleton /> : (
            <ul className="grid grid-cols-3 gap-3">
              <StatCard index={0} Icon={FiShoppingBag} label={t('allOrders', 'All orders')} value={enriched.length} />
              <StatCard index={1} Icon={FiClock} label={t('inProgress', 'In progress')} value={inProgress} />
              <StatCard index={2} Icon={FiCheck} label={t('status_DELIVERED', 'Delivered')} value={counts.DELIVERED || 0} />
            </ul>
          )}
        </header>

        {filtersOpen && <div id="orders-filters" className="mb-6 lg:hidden">{filterPanel}</div>}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
          <main className="min-w-0">{content}</main>
          <aside aria-label={t('filters', 'Filters')} className="sticky top-32 hidden max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain p-2 -m-2 lg:block">{filterPanel}</aside>
        </div>
      </div>

      {selectedOrder && <OrderModal order={selectedOrder} onClose={closeDetails} onPreview={openPreview} t={t} />}
      {previewItem && <ItemPreview item={previewItem} onClose={closePreview} t={t} />}
      {dlg && <ConfirmDialog dlg={dlg} onSettle={settle} onClose={closeConfirm} />}
    </div>
  );
};

MyOrdersContent.displayName = 'MyOrdersContent';

export { queryClient };
export default function MyOrders(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <MyOrdersContent {...props} />
    </QueryClientProvider>
  );
}