import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo,
} from 'react';
import {
  FiInfo, FiChevronRight, FiChevronLeft, FiChevronUp, FiChevronDown, FiX, FiCheck,
  FiFilter, FiRefreshCw, FiStar, FiMessageSquare, FiEdit2, FiTrash2, FiSend,
  FiBox, FiClock, FiCheckCircle,
} from 'react-icons/fi';
import api from '../common/api/api';
import { EXTRAS_CSS, Toaster, toast } from '../components/user/UiExtras';
import {
  POLL_MS, DEFAULT_LABELS, tpl, renderTpl, fmt, isSafeId, shortId, errText,
  confirmDialog, useDarkMode, useEscape, useShopLocale,
} from '../components/shop/TableKit';
import { ensureShopAssets } from '../common/utils/shopFonts';

ensureShopAssets();

const BASE = '/api/shop/reviews';
const REPLY_MAX = 1000;

const PG_CSS = `
.pg{--pg-bg:#f9fafb;--pg-card:#ffffff;--pg-ink:#04261a;--pg-muted:#4b6b5c;--pg-line:#04261a;--pg-shadow:#04261a;--pg-gray:#e8ebe9;--pg-dot:#04261a;--pg-accent:#10b981;--pg-btn:#059669;--pg-on:#ffffff;background:var(--pg-bg);color:var(--pg-ink)}
.dark .pg{--pg-bg:#141414;--pg-card:#2a2a2a;--pg-ink:#ffffff;--pg-muted:#a3a3a3;--pg-line:#000000;--pg-shadow:#000000;--pg-gray:#1e1e1e;--pg-dot:#3f3f3f;--pg-accent:#39ff88;--pg-btn:#39ff88;--pg-on:#022c22}
.pg[dir="rtl"] *{letter-spacing:0!important}
.pg-gray{background:var(--pg-gray)}
.pg-muted{color:var(--pg-muted)}
.pg-line{border-color:var(--pg-line)}
.pg-dot{border:2px dotted var(--pg-dot)}
.pg-card{background:var(--pg-card);border:2px solid var(--pg-line);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-lift{transition:transform .15s ease,box-shadow .15s ease}
.pg-lift:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--pg-shadow)}
.pg-ul{text-decoration:underline;text-decoration-color:var(--pg-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.pg-chip{display:inline-flex;align-items:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);padding:1px 8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;line-height:1.6;white-space:nowrap}
.pg-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--pg-line);background:var(--pg-accent);color:#04261a}
.pg-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow);font-weight:700;cursor:pointer;white-space:nowrap;transition:transform .12s ease,box-shadow .12s ease}
.pg-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pg-shadow)}
.pg-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--pg-shadow)}
.pg-btn:disabled{opacity:.45;cursor:not-allowed}
.pg-btn-a,.pg-btn[aria-pressed="true"],.pg-btn[aria-selected="true"],.pg-btn[aria-current="page"]{background:var(--pg-btn);color:var(--pg-on)}
.pg-btn-danger:hover:not(:disabled){background:#ef4444;color:#fff}
.pg-btn:focus-visible,.pg-sort:focus-visible,.pg-link:focus-visible{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field{background:var(--pg-card);color:var(--pg-ink);border:2px solid var(--pg-line);box-shadow:2px 2px 0 var(--pg-shadow)}
.pg-field:focus,.pg-field:focus-within{outline:3px solid var(--pg-accent);outline-offset:2px}
.pg-field::placeholder{color:var(--pg-muted);opacity:.8}
.pg-th{background:var(--pg-gray);border-bottom:2px solid var(--pg-line);padding:12px;text-align:start;font-size:11px;font-weight:800;text-transform:uppercase;white-space:nowrap}
.pg-td{border-top:2px dotted var(--pg-dot)}
tbody tr:first-child .pg-td{border-top:0}
.pg-tr{transition:background-color .12s ease}
.pg-tr:hover{background:var(--pg-gray)}
.pg-sub{background:var(--pg-gray);border:2px solid var(--pg-line);border-inline-start:5px solid var(--pg-accent)}
.pg-star-on{color:#f59e0b}
.pg-star-off{color:var(--pg-muted);opacity:.35}
.pg-scroll{scrollbar-width:thin;scrollbar-color:var(--pg-accent) transparent}
.pg-scroll::-webkit-scrollbar{width:6px;height:6px}
.pg-scroll::-webkit-scrollbar-track{background:transparent}
.pg-scroll::-webkit-scrollbar-thumb{background:var(--pg-accent);border:1px solid var(--pg-line)}
@keyframes pgFade{from{opacity:0}to{opacity:1}}
@keyframes pgIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pg-fade{animation:pgFade .2s ease-out both}
.pg-in{animation:pgIn .15s ease-out both}
@media (prefers-reduced-motion:reduce){.pg-btn,.pg-lift,.pg-tr{transition:none}.pg-fade,.pg-in{animation:none}}
`;
const STYLE_EL = <style>{PG_CSS + EXTRAS_CSS}</style>;

const TONES = { sky: '#22d3ee', am: '#facc15', ro: '#fb7185', vi: '#a3e635', te: '#2dd4bf', em: '#34d399' };
const ROW_OPTIONS = [5, 10, 25, 50];
const SKELETON_CELLS = [0, 1, 2, 3, 4, 5];
const STAR_LIST = [1, 2, 3, 4, 5];
const TABS = ['all', 'unanswered', 'answered'];
const SORT_VALUES = ['newest', 'oldest', 'highest', 'lowest'];
const RATING_VALUES = ['all', 5, 4, 3, 2, 1];

const TEXT = {
  en: {
    docTitle: 'Customer Reviews',
    title: ['Customer ', 'Reviews'],
    subtitle: 'See what customers say about your shop and reply publicly.',
    stats: {
      total: { label: 'Total reviews', desc: 'All customer ratings' },
      average: { label: 'Average rating', desc: 'Out of 5 stars' },
      unanswered: { label: 'Awaiting reply', desc: 'Needs your response' },
      answered: { label: 'Replied', desc: 'You responded' },
    },
    tabsAria: 'Filter reviews by reply status',
    tabs: { all: 'All', unanswered: 'Unanswered', answered: 'Replied' },
    columns: { customer: 'Customer', rating: 'Rating', review: 'Review', date: 'Date', status: 'Status', actions: 'Actions' },
    status: { replied: 'Replied', pending: 'Needs reply' },
    row: { reply: 'Reply', details: 'Details', noComment: 'No written comment' },
    customer: 'Customer',
    cancel: 'Cancel',
    sort: { newest: 'Newest', oldest: 'Oldest', highest: 'Highest rated', lowest: 'Lowest rated' },
    filter: {
      title: 'Filters', note: 'Narrow down your reviews list.', sortBy: 'Sort by', rating: 'Rating',
      allRatings: 'All ratings', stars: '{n} stars',
    },
    details: {
      title: 'Review details', customer: 'Customer', rating: 'Rating', date: 'Date', comment: 'Review',
      yourReply: 'Your reply', replyLabel: 'Write your reply', placeholder: 'Write a public reply to this customer...',
      send: 'Send reply', save: 'Save changes', edit: 'Edit reply', remove: 'Delete reply',
      publicNote: 'Your reply is public and appears under the review on your shop page.',
    },
    empty: { title: 'No reviews found', subtitle: 'Reviews appear here after customers rate your shop.' },
    confirm: { title: 'Delete this reply?', text: 'The customer will no longer see it.', button: 'Delete' },
    toasts: {
      sent: 'Reply sent', updated: 'Reply updated', deleted: 'Reply deleted',
      loadFail: 'Could not load reviews', failed: 'Something went wrong', confirmFail: 'Could not open the confirmation',
    },
    unit: 'reviews',
  },
  ar: {
    docTitle: 'تقييمات العملاء',
    title: ['تقييمات ', 'العملاء'],
    subtitle: 'اطلع على آراء العملاء عن متجرك وقم بالرد عليها علنًا.',
    stats: {
      total: { label: 'إجمالي التقييمات', desc: 'كل تقييمات العملاء' },
      average: { label: 'متوسط التقييم', desc: 'من 5 نجوم' },
      unanswered: { label: 'بانتظار الرد', desc: 'تحتاج إلى ردك' },
      answered: { label: 'تم الرد', desc: 'قمت بالرد عليها' },
    },
    tabsAria: 'تصفية التقييمات حسب حالة الرد',
    tabs: { all: 'الكل', unanswered: 'بدون رد', answered: 'تم الرد' },
    columns: { customer: 'العميل', rating: 'التقييم', review: 'التعليق', date: 'التاريخ', status: 'الحالة', actions: 'الإجراءات' },
    status: { replied: 'تم الرد', pending: 'بحاجة لرد' },
    row: { reply: 'رد', details: 'التفاصيل', noComment: 'لا يوجد تعليق مكتوب' },
    customer: 'عميل',
    cancel: 'إلغاء',
    sort: { newest: 'الأحدث', oldest: 'الأقدم', highest: 'الأعلى تقييماً', lowest: 'الأقل تقييماً' },
    filter: {
      title: 'الفلاتر', note: 'قم بتضييق قائمة التقييمات.', sortBy: 'ترتيب حسب', rating: 'التقييم',
      allRatings: 'كل التقييمات', stars: '{n} نجوم',
    },
    details: {
      title: 'تفاصيل التقييم', customer: 'العميل', rating: 'التقييم', date: 'التاريخ', comment: 'التعليق',
      yourReply: 'ردك', replyLabel: 'اكتب ردك', placeholder: 'اكتب ردًا علنيًا لهذا العميل...',
      send: 'إرسال الرد', save: 'حفظ التعديلات', edit: 'تعديل الرد', remove: 'حذف الرد',
      publicNote: 'ردك علني ويظهر أسفل التقييم في صفحة متجرك.',
    },
    empty: { title: 'لا توجد تقييمات', subtitle: 'ستظهر التقييمات هنا بعد أن يقيّم العملاء متجرك.' },
    confirm: { title: 'حذف هذا الرد؟', text: 'لن يتمكن العميل من رؤيته بعد الآن.', button: 'حذف' },
    toasts: {
      sent: 'تم إرسال الرد', updated: 'تم تحديث الرد', deleted: 'تم حذف الرد',
      loadFail: 'تعذر تحميل التقييمات', failed: 'حدث خطأ ما', confirmFail: 'تعذر فتح نافذة التأكيد',
    },
    unit: 'تقييم',
  },
};

const pageList = (page, total) => {
  const keep = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i && n - nums[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
};

const useLockScroll = () => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
};

const Tile = memo(({ icon: Icon, tone = 'em', className = 'h-9 w-9', size = 16 }) => (
  <span className={`pg-tile ${className}`} style={{ background: TONES[tone] || TONES.em }}>
    <Icon size={size} aria-hidden="true" />
  </span>
));

const Empty = memo(({ title, subtitle }) => (
  <div className="flex flex-col items-center text-center gap-3">
    <span className="pg-tile h-16 w-16"><FiBox size={28} aria-hidden="true" /></span>
    <p className="text-base font-extrabold uppercase"><span className="pg-ul">{title}</span></p>
    <p className="pg-muted text-xs font-semibold max-w-xs">{subtitle}</p>
  </div>
));

const StatCard = memo(({ label, value, description, icon, tone }) => (
  <div className="pg-card pg-lift p-4 sm:p-5 flex items-center gap-3 min-w-0">
    <Tile icon={icon} tone={tone} className="h-11 w-11" size={20} />
    <div className="min-w-0">
      <p className="pg-muted text-[11px] font-bold uppercase truncate">{label}</p>
      <p className="text-2xl font-extrabold tracking-tight leading-tight tabular-nums truncate">{value}</p>
      <p className="pg-muted text-xs font-semibold truncate">{description}</p>
    </div>
  </div>
));

const RowsSelect = memo(({ value, onChange, label, formatNumber }) => {
  const options = useMemo(
    () => (ROW_OPTIONS.includes(value) ? ROW_OPTIONS : [...ROW_OPTIONS, value].sort((a, b) => a - b)),
    [value],
  );
  const text = label || DEFAULT_LABELS.rows;
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={tpl(text, { n: '' }).trim() || undefined}
      className="pg-field h-10 px-3 text-sm font-bold cursor-pointer"
    >
      {options.map((n) => <option key={n} value={n}>{tpl(text, { n: formatNumber(n) })}</option>)}
    </select>
  );
});

const SortTh = memo(({ label, active, dir, onClick }) => (
  <th scope="col" className="pg-th" aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
    <button type="button" onClick={onClick} className="pg-sort inline-flex items-center gap-1 font-extrabold uppercase">
      {label}
      {active && dir === 'asc' ? <FiChevronUp size={13} aria-hidden="true" /> : <FiChevronDown size={13} aria-hidden="true" className={active ? '' : 'opacity-30'} />}
    </button>
  </th>
));

const Pagination = memo(({ page, total, onChange, labels = {}, formatNumber }) => {
  const pages = useMemo(() => pageList(page, total), [page, total]);
  return (
    <nav aria-label={labels.paginationAria || DEFAULT_LABELS.paginationAria} className="flex items-center gap-1.5 flex-wrap justify-center">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={labels.prev || DEFAULT_LABELS.prev} className="pg-btn h-8 w-8">
        <FiChevronLeft size={14} className="rtl:rotate-180" aria-hidden="true" />
      </button>
      {pages.map((p) => (typeof p === 'string'
        ? <span key={p} className="pg-muted px-1 text-xs font-bold" aria-hidden="true">…</span>
        : (
          <button key={p} type="button" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined} className="pg-btn h-8 min-w-[32px] px-2 text-xs tabular-nums">
            {formatNumber(p)}
          </button>
        )))}
      <button type="button" disabled={page >= total} onClick={() => onChange(page + 1)} aria-label={labels.next || DEFAULT_LABELS.next} className="pg-btn h-8 w-8">
        <FiChevronRight size={14} className="rtl:rotate-180" aria-hidden="true" />
      </button>
    </nav>
  );
});

const Overlay = memo(({ onClose, children }) => {
  useLockScroll();
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4">
      <div className="pg-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {children}
    </div>
  );
});

const FilterPanel = memo(({ title, note, groups, onReset, onClose, labels = {} }) => {
  useEscape(onClose);
  useLockScroll();
  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      <div className="pg-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label={title} className="pg-card pg-in relative w-full max-w-xs h-full flex flex-col !shadow-none border-y-0 border-e-0">
        <div className="pg-gray pg-line px-5 py-4 border-b-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{title}</span></h3>
          <button type="button" onClick={onClose} aria-label={labels.close || DEFAULT_LABELS.close} className="pg-btn h-8 w-8"><FiX size={15} aria-hidden="true" /></button>
        </div>
        <div className="flex-1 overflow-y-auto pg-scroll p-5 space-y-5">
          {note && <p className="pg-muted text-xs font-semibold">{note}</p>}
          {groups.map(([groupTitle, options, value, setter]) => (
            <fieldset key={groupTitle} className="space-y-2">
              <legend className="mb-2 text-[11px] font-extrabold uppercase">{groupTitle}</legend>
              {options.map((o) => (
                <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => setter(o.value)} className="pg-btn w-full justify-between px-3 h-10 text-xs uppercase">
                  {o.label}
                  {value === o.value && <FiCheck size={14} aria-hidden="true" />}
                </button>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="pg-line p-4 border-t-2 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onReset} className="pg-btn h-10 text-xs uppercase">{labels.reset || DEFAULT_LABELS.reset}</button>
          <button type="button" onClick={onClose} className="pg-btn pg-btn-a h-10 text-xs uppercase">{labels.apply || DEFAULT_LABELS.apply}</button>
        </div>
      </aside>
    </div>
  );
});

const Stars = memo(({ value, size = 14 }) => {
  const number = Number(value) || 0;
  const full = Math.max(0, Math.min(5, Math.round(number)));
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${number.toFixed(1)} / 5`}>
      {STAR_LIST.map((n) => (
        <FiStar key={n} size={size} aria-hidden="true" className={n <= full ? 'fill-current pg-star-on' : 'pg-star-off'} />
      ))}
    </span>
  );
});

const StatusPill = memo(({ replied, t }) => (
  <span className="pg-chip">
    <span className={`pg-line w-2 h-2 border ${replied ? 'bg-emerald-500' : 'bg-amber-400'}`} />
    {replied ? t.status.replied : t.status.pending}
  </span>
));

const ReviewRow = memo(({ review, t, fm, onOpen }) => {
  const name = review.reviewerName || t.customer;
  const replied = !!review.reply;
  return (
    <tr className="pg-tr">
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <span className="pg-tile h-9 w-9 text-sm font-extrabold uppercase" style={{ background: TONES.ro }}>
            {name.trim().charAt(0) || '?'}
          </span>
          <div className="min-w-0">
            <p className="max-w-[160px] truncate text-xs font-extrabold uppercase">{name}</p>
            <p className="pg-muted text-[10px] font-mono font-semibold">#{shortId(review.id)}</p>
          </div>
        </div>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap"><Stars value={review.rating} /></td>
      <td className="pg-td px-3 py-2.5 max-w-[280px]">
        <p className={`truncate text-xs font-semibold ${review.comment ? '' : 'pg-muted'}`}>{review.comment || t.row.noComment}</p>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <p className="text-xs font-bold">{fmt(fm.date, review.createdAt)}</p>
        <p className="pg-muted text-[10px] font-semibold">{fmt(fm.time, review.createdAt)}</p>
      </td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap"><StatusPill replied={replied} t={t} /></td>
      <td className="pg-td px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          {!replied && (
            <button type="button" onClick={() => onOpen(review)} className="pg-btn pg-btn-a px-2.5 h-8 text-[11px] uppercase">
              <FiMessageSquare size={13} aria-hidden="true" /> {t.row.reply}
            </button>
          )}
          <button type="button" title={t.row.details} aria-label={t.row.details} onClick={() => onOpen(review)} className="pg-btn h-8 w-8">
            <FiInfo size={14} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
});

const ReviewModal = memo(({ review, busy, t, fm, onClose, onSave, onDelete }) => {
  useEscape(onClose);
  const d = t.details;
  const hasReply = !!review.reply;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const composing = !hasReply || editing;
  const name = review.reviewerName || t.customer;

  const startEdit = () => { setText(review.reply || ''); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setText(''); };
  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    const ok = await onSave(review, value);
    if (ok) { setEditing(false); setText(''); }
  };

  return (
    <Overlay onClose={onClose}>
      <div role="dialog" aria-modal="true" aria-label={d.title} className="pg-card pg-in relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden">
        <div className="pg-gray pg-line flex flex-shrink-0 items-center justify-between gap-3 border-b-2 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Tile icon={FiStar} tone="am" />
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold uppercase"><span className="pg-ul">{d.title}</span></h3>
              <p className="pg-muted mt-1 text-[10px] font-bold font-mono">#{shortId(review.id)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label={DEFAULT_LABELS.close} className="pg-btn h-8 w-8 flex-shrink-0"><FiX size={15} aria-hidden="true" /></button>
        </div>

        <div className="pg-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="pg-gray pg-dot min-w-0 p-3">
              <p className="pg-muted mb-1 text-[9px] font-bold uppercase">{d.customer}</p>
              <p className="truncate text-xs font-extrabold">{name}</p>
            </div>
            <div className="pg-gray pg-dot min-w-0 p-3">
              <p className="pg-muted mb-1 text-[9px] font-bold uppercase">{d.date}</p>
              <p className="truncate text-xs font-extrabold">{fmt(fm.full, review.createdAt)}</p>
            </div>
          </div>

          <div className="pg-card !shadow-none overflow-hidden">
            <div className="pg-gray pg-line flex items-center justify-between gap-2 border-b-2 px-3.5 py-2.5">
              <p className="text-[10px] font-extrabold uppercase">{d.comment}</p>
              <Stars value={review.rating} size={13} />
            </div>
            <p className={`whitespace-pre-wrap break-words px-3.5 py-3 text-sm font-semibold leading-6 ${review.comment ? '' : 'pg-muted'}`}>
              {review.comment || t.row.noComment}
            </p>
          </div>

          {hasReply && !editing && (
            <div className="pg-sub p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase">
                  <FiMessageSquare size={12} aria-hidden="true" /> {d.yourReply}
                </p>
                <span className="pg-muted text-[10px] font-bold">{fmt(fm.full, review.repliedAt)}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap break-words text-sm font-semibold leading-6">{review.reply}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={busy} onClick={startEdit} className="pg-btn h-8 px-3 text-[11px] uppercase">
                  <FiEdit2 size={12} aria-hidden="true" /> {d.edit}
                </button>
                <button type="button" disabled={busy} onClick={() => onDelete(review)} className="pg-btn pg-btn-danger h-8 px-3 text-[11px] uppercase">
                  <FiTrash2 size={12} aria-hidden="true" /> {d.remove}
                </button>
              </div>
            </div>
          )}

          {composing && (
            <form id="review-reply-form" onSubmit={submit} className="space-y-2">
              <label htmlFor="review-reply" className="text-[11px] font-extrabold uppercase">{d.replyLabel}</label>
              <textarea
                id="review-reply"
                autoFocus
                value={text}
                rows={4}
                maxLength={REPLY_MAX}
                disabled={busy}
                placeholder={d.placeholder}
                onChange={(e) => setText(e.target.value)}
                className="pg-field w-full resize-y p-3 text-sm font-semibold outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <p className="pg-muted text-[10px] font-bold">{d.publicNote}</p>
                <span className="pg-muted flex-shrink-0 text-[10px] font-bold tabular-nums">{text.length}/{REPLY_MAX}</span>
              </div>
            </form>
          )}
        </div>

        <div className="pg-line flex flex-shrink-0 flex-wrap gap-2.5 border-t-2 px-4 py-3.5 sm:px-5">
          {composing ? (
            <>
              {editing && (
                <button type="button" disabled={busy} onClick={cancelEdit} className="pg-btn h-10 min-w-[110px] flex-1 text-xs uppercase">{t.cancel}</button>
              )}
              <button type="submit" form="review-reply-form" disabled={busy || !text.trim()} className="pg-btn pg-btn-a h-10 min-w-[110px] flex-1 text-xs uppercase">
                <FiSend size={13} aria-hidden="true" className="rtl:-scale-x-100" /> {hasReply ? d.save : d.send}
              </button>
            </>
          ) : null}
          <button type="button" onClick={onClose} className="pg-btn h-10 px-3 text-xs uppercase">{DEFAULT_LABELS.close}</button>
        </div>
      </div>
    </Overlay>
  );
});

const ShopReviews = () => {
  const darkMode = useDarkMode();
  const { language, dir, font, L, fm } = useShopLocale();
  const t = TEXT[language === 'ar' ? 'ar' : 'en'];
  const nf = fm.number;
  const avgFmt = useMemo(
    () => new Intl.NumberFormat(nf.resolvedOptions().locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    [nf],
  );

  const tRef = useRef(t);
  const lRef = useRef(L);
  tRef.current = t;
  lRef.current = L;

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);

  const queryRef = useRef({ tab, page, size: rowsPerPage, sort: sortBy, rating: ratingFilter });
  queryRef.current = { tab, page, size: rowsPerPage, sort: sortBy, rating: ratingFilter };
  const abortRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => { document.title = t.docTitle; }, [t.docTitle]);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!silent) setLoading(true);
    const q = queryRef.current;
    const params = { page: q.page - 1, size: q.size, sort: q.sort };
    if (q.rating !== 'all') params.rating = q.rating;
    if (q.tab !== 'all') params.replied = q.tab === 'answered';
    try {
      const [list, sum] = await Promise.allSettled([
        api.get(BASE, { params, signal: controller.signal }),
        api.get(`${BASE}/summary`, { signal: controller.signal }),
      ]);
      if (controller.signal.aborted) return;
      if (list.status === 'fulfilled') {
        const data = list.value.data;
        const content = Array.isArray(data?.content) ? data.content : [];
        const pages = data?.totalPages || 0;
        if (!content.length && q.page > 1) {
          setPage(Math.max(1, pages));
          return;
        }
        setItems(content);
        setTotalItems(data?.totalElements || 0);
        setTotalPages(pages);
        setLastUpdated(new Date());
      } else if (!silent) {
        toast({ icon: 'error', title: tRef.current.toasts.loadFail, text: errText(list.reason) });
      }
      if (sum.status === 'fulfilled') setSummary(sum.value.data);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData, tab, page, rowsPerPage, sortBy, ratingFilter]);

  useEffect(() => {
    const iv = setInterval(() => { if (!document.hidden) fetchData({ silent: true }); }, POLL_MS);
    return () => { clearInterval(iv); abortRef.current?.abort(); };
  }, [fetchData]);

  const adjustUnanswered = useCallback((delta) => {
    setSummary((s) => (s ? { ...s, unanswered: Math.max(0, (s.unanswered || 0) + delta) } : s));
  }, []);

  const saveReply = useCallback(async (review, text) => {
    if (busyRef.current || !isSafeId(review.id)) return false;
    busyRef.current = true;
    setBusy(true);
    const isEdit = !!review.reply;
    try {
      const url = `${BASE}/${encodeURIComponent(review.id)}/reply`;
      const { data } = isEdit ? await api.put(url, { reply: text }) : await api.post(url, { reply: text });
      setSelected(data);
      setItems((prev) => prev.map((i) => (i.id === data.id ? data : i)));
      if (!isEdit) adjustUnanswered(-1);
      toast({ icon: 'success', title: isEdit ? tRef.current.toasts.updated : tRef.current.toasts.sent });
      if (queryRef.current.tab !== 'all') fetchData({ silent: true });
      return true;
    } catch (err) {
      toast({ icon: 'error', title: tRef.current.toasts.failed, text: errText(err) });
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [adjustUnanswered, fetchData]);

  const deleteReply = useCallback(async (review) => {
    if (busyRef.current || !isSafeId(review.id)) return;
    const c = tRef.current.confirm;
    let isConfirmed = false;
    try {
      ({ isConfirmed } = await confirmDialog({
        title: c.title,
        text: c.text,
        icon: 'warning',
        confirmButtonText: c.button,
        cancelButtonText: lRef.current.table.cancel,
        confirmButtonColor: '#ef4444',
      }));
    } catch {
      toast({ icon: 'error', title: tRef.current.toasts.confirmFail });
      return;
    }
    if (!isConfirmed) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await api.delete(`${BASE}/${encodeURIComponent(review.id)}/reply`);
      const cleared = { reply: null, repliedAt: null };
      setSelected((s) => (s && s.id === review.id ? { ...s, ...cleared } : s));
      setItems((prev) => prev.map((i) => (i.id === review.id ? { ...i, ...cleared } : i)));
      adjustUnanswered(1);
      toast({ icon: 'success', title: tRef.current.toasts.deleted });
      if (queryRef.current.tab !== 'all') fetchData({ silent: true });
    } catch (err) {
      toast({ icon: 'error', title: tRef.current.toasts.failed, text: errText(err) });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [adjustUnanswered, fetchData]);

  const changeTab = useCallback((v) => { setTab(v); setPage(1); }, []);
  const changeRows = useCallback((v) => { setRowsPerPage(v); setPage(1); }, []);
  const changeSort = useCallback((v) => { setSortBy(v); setPage(1); }, []);
  const changeRating = useCallback((v) => { setRatingFilter(v); setPage(1); }, []);
  const toggleDateSort = useCallback(() => { setSortBy((s) => (s === 'newest' ? 'oldest' : 'newest')); setPage(1); }, []);
  const toggleRatingSort = useCallback(() => { setSortBy((s) => (s === 'highest' ? 'lowest' : 'highest')); setPage(1); }, []);
  const resetFilters = useCallback(() => { setSortBy('newest'); setRatingFilter('all'); setPage(1); }, []);
  const openFilter = useCallback(() => setShowFilterPanel(true), []);
  const closeFilter = useCallback(() => setShowFilterPanel(false), []);
  const openReview = useCallback((r) => setSelected(r), []);
  const closeReview = useCallback(() => setSelected(null), []);
  const refresh = useCallback(() => fetchData(), [fetchData]);

  const total = summary?.total ?? 0;
  const unanswered = summary?.unanswered ?? 0;
  const counts = { all: total, unanswered, answered: Math.max(0, total - unanswered) };

  const statCards = useMemo(() => [
    { label: t.stats.total.label, value: nf.format(total), description: t.stats.total.desc, icon: FiStar, tone: 'am' },
    { label: t.stats.average.label, value: avgFmt.format(summary?.average || 0), description: t.stats.average.desc, icon: FiStar, tone: 'vi' },
    { label: t.stats.unanswered.label, value: nf.format(unanswered), description: t.stats.unanswered.desc, icon: FiClock, tone: 'ro' },
    { label: t.stats.answered.label, value: nf.format(counts.answered), description: t.stats.answered.desc, icon: FiCheckCircle, tone: 'em' },
  ], [t, nf, avgFmt, summary, total, unanswered, counts.answered]);

  const filterGroups = useMemo(() => [
    [t.filter.sortBy, SORT_VALUES.map((v) => ({ value: v, label: t.sort[v] })), sortBy, changeSort],
    [
      t.filter.rating,
      RATING_VALUES.map((v) => ({ value: v, label: v === 'all' ? t.filter.allRatings : tpl(t.filter.stars, { n: nf.format(v) }) })),
      ratingFilter,
      changeRating,
    ],
  ], [t, nf, sortBy, ratingFilter, changeSort, changeRating]);

  const skeletonRows = useMemo(() => Array.from({ length: Math.min(rowsPerPage, 8) }, (_, i) => i), [rowsPerPage]);
  const activeFilterCount = (ratingFilter !== 'all') + (sortBy !== 'newest');
  const from = totalItems ? (page - 1) * rowsPerPage + 1 : 0;
  const to = Math.min(page * rowsPerPage, totalItems);
  const bold = 'tabular-nums';

  return (
    <div dir={dir} lang={language} style={font} className="pg min-h-screen py-6 lg:ps-64 mt-16 text-start overflow-x-hidden">
      {STYLE_EL}
      <Toaster darkMode={darkMode} />

      <div key={language} className="pg-fade max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <header className="px-0.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">{t.title[0]}<span className="pg-ul">{t.title[1]}</span></h1>
            <p className="pg-muted mt-2 text-sm font-medium">{t.subtitle}</p>
          </header>
          <div className="flex items-center gap-2.5">
            {lastUpdated && <p className="pg-muted hidden sm:block text-[11px] font-bold">{tpl(L.table.lastUpdated, { time: fmt(fm.time, lastUpdated) })}</p>}
            <button type="button" onClick={refresh} aria-label={L.table.refresh} title={L.table.refresh} className="pg-btn h-10 px-3 text-xs uppercase">
              <FiRefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" /> {L.table.refresh}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <section className="pg-card overflow-hidden">
          <div className="pg-line p-3 sm:p-4 flex flex-wrap items-center justify-end gap-2.5 border-b-2">
            <RowsSelect value={rowsPerPage} onChange={changeRows} label={L.table.rows} formatNumber={nf.format} />
            <button type="button" onClick={openFilter} className="pg-btn relative h-10 px-3 text-xs uppercase">
              <FiFilter size={14} aria-hidden="true" /> {L.table.filter}
              {activeFilterCount > 0 && (
                <span className="pg-line absolute -top-2 -end-2 w-5 h-5 border-2 bg-[var(--pg-btn)] text-[var(--pg-on)] text-[10px] font-extrabold grid place-items-center">{nf.format(activeFilterCount)}</span>
              )}
            </button>
          </div>

          <div role="tablist" aria-label={t.tabsAria} className="pg-line pg-scroll flex gap-2 overflow-x-auto px-3 sm:px-4 py-3 border-b-2">
            {TABS.map((s) => (
              <button key={s} type="button" role="tab" aria-selected={tab === s} onClick={() => changeTab(s)} className="pg-btn flex-shrink-0 h-9 px-3 text-xs uppercase">
                {t.tabs[s]}
                <span className="tabular-nums opacity-80">{nf.format(counts[s] || 0)}</span>
              </button>
            ))}
          </div>

          <div className="overflow-auto max-h-[68vh] pg-scroll" aria-busy={loading}>
            <table className="w-full min-w-[900px] text-start border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th scope="col" className="pg-th">{t.columns.customer}</th>
                  <SortTh label={t.columns.rating} active={sortBy === 'highest' || sortBy === 'lowest'} dir={sortBy === 'lowest' ? 'asc' : 'desc'} onClick={toggleRatingSort} />
                  <th scope="col" className="pg-th">{t.columns.review}</th>
                  <SortTh label={t.columns.date} active={sortBy === 'newest' || sortBy === 'oldest'} dir={sortBy === 'oldest' ? 'asc' : 'desc'} onClick={toggleDateSort} />
                  <th scope="col" className="pg-th">{t.columns.status}</th>
                  <th scope="col" className="pg-th">{t.columns.actions}</th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  skeletonRows.map((i) => (
                    <tr key={i} className="animate-pulse motion-reduce:animate-none">
                      {SKELETON_CELLS.map((j) => <td key={j} className="pg-td px-3 py-4"><div className="pg-gray h-3.5 w-full" /></td>)}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-14"><Empty title={t.empty.title} subtitle={t.empty.subtitle} /></td></tr>
                ) : (
                  items.map((r) => <ReviewRow key={r.id} review={r} t={t} fm={fm} onOpen={openReview} />)
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && (
            <div className="pg-gray pg-line px-4 py-3 border-t-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="pg-muted text-xs font-bold">
                {renderTpl(L.table.showing || DEFAULT_LABELS.showing, {
                  range: <b className={bold}>{nf.format(from)}–{nf.format(to)}</b>,
                  total: <b className={bold}>{nf.format(totalItems)}</b>,
                  unit: t.unit,
                })}
              </p>
              {totalPages > 1 && <Pagination page={page} total={totalPages} onChange={setPage} labels={L.table} formatNumber={nf.format} />}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <ReviewModal
          key={selected.id}
          review={selected}
          busy={busy}
          t={t}
          fm={fm}
          onClose={closeReview}
          onSave={saveReply}
          onDelete={deleteReply}
        />
      )}

      {showFilterPanel && (
        <FilterPanel title={t.filter.title} note={t.filter.note} groups={filterGroups} onReset={resetFilters} onClose={closeFilter} labels={L.table} />
      )}
    </div>
  );
};

export default memo(ShopReviews);