import React, { memo } from 'react';
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react';
import {
  FiTool, FiRefreshCw, FiShield, FiX, FiChevronDown, FiCheck, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import { RiVerifiedBadgeLine } from 'react-icons/ri';

/* Shared building blocks for Shops / Track / DeviceDetail / CategoryProducts / Account.
   Location: src/components/Ui3D.jsx */

/* ───────────── global CSS (render once per page: <style>{UI3D_CSS}</style>) ───────────── */
export const UI3D_CSS = `
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  .anim-float { animation: floatY 6s ease-in-out infinite; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .anim-fade-up { animation: fadeUp .22s ease-out both; animation-delay: calc(var(--i, 0) * 25ms); }
  .hide-scrollbar { scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  @media (prefers-reduced-motion: reduce) { .anim-float, .anim-fade-up { animation: none !important; } }
`;

/* ───────────── class helpers ───────────── */
export const cardCls = (dm) => `rounded-2xl border ${dm ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`;
export const tileCls = (dm) => (dm ? 'bg-emerald-900/30' : 'bg-gradient-to-br from-emerald-50 to-emerald-100');
export const inputCls = (dm) =>
  `rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 ${
    dm ? 'border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400'}`;

/* ───────────── 3D glyphs (gradients defined once) ───────────── */
export const kindOf = (name = '', fallback = 'store') => {
  const k = String(name).toLowerCase();
  if (k.includes('repair') || k.includes('service') || k.includes('fix')) return 'wrench';
  if (k.includes('phone') || k.includes('mobile') || k.includes('tablet')) return 'phone';
  if (k.includes('laptop') || k.includes('computer') || k.includes('pc')) return 'laptop';
  if (k.includes('address') || k.includes('location') || k.includes('map')) return 'pin';
  if (k.includes('notif') || k.includes('bell')) return 'bell';
  if (k.includes('user') || k.includes('profile')) return 'user';
  if (k.includes('box') || k.includes('accessor') || k.includes('headphone') || k.includes('watch')) return 'box';
  return fallback;
};

export const Defs3D = memo(() => (
  <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
    <defs>
      {[['em', '#6EE7B7', '#047857'], ['fr', '#0F766E', '#022C22'], ['sd', '#064E3B', '#011A14'], ['sc', '#A7F3D0', '#059669'], ['lt', '#FFFFFF', '#BBF7D0']].map(([id, a, b]) => (
        <linearGradient key={id} id={`g3-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={a} /><stop offset="100%" stopColor={b} />
        </linearGradient>
      ))}
    </defs>
  </svg>
));

/* `kind` (explicit) wins over `name` (auto-detected from text) */
export const Glyph3D = memo(({ name = '', kind, fallback = 'store', className = 'w-10 h-10' }) => {
  const fr = 'url(#g3-fr)', sd = 'url(#g3-sd)', sc = 'url(#g3-sc)', lt = 'url(#g3-lt)', em = 'url(#g3-em)';
  const W = '#fff';
  let body;
  switch (kind || kindOf(name, fallback)) {
    case 'wrench':
      body = (<>
        <rect x="26" y="26" width="14" height="38" rx="6" fill={sd} transform="rotate(-40 33 45) translate(3 3)" />
        <rect x="26" y="26" width="14" height="38" rx="6" fill={fr} transform="rotate(-40 33 45)" />
        <circle cx="42" cy="22" r="15" fill={em} />
        <circle cx="42" cy="22" r="7" fill={sd} />
        <rect x="35" y="3" width="14" height="12" fill={sd} transform="rotate(25 42 22)" />
      </>); break;
    case 'phone':
      body = (<>
        <rect x="22" y="6" width="26" height="56" rx="7" fill={sd} />
        <rect x="18" y="2" width="26" height="56" rx="7" fill={fr} />
        <rect x="21" y="5.5" width="20" height="49" rx="4.5" fill={sc} />
        <path d="M21 32V10a4.5 4.5 0 014.5-4.5H34z" fill={W} opacity="0.3" />
        <rect x="24" y="12" width="14" height="3.5" rx="1.7" fill={W} opacity="0.9" />
        <rect x="24" y="40" width="14" height="10" rx="3" fill={W} opacity="0.3" />
      </>); break;
    case 'laptop':
      body = (<>
        <rect x="14" y="12" width="42" height="29" rx="4" fill={sd} />
        <rect x="11" y="9" width="42" height="29" rx="4" fill={fr} />
        <rect x="14" y="12" width="36" height="23" rx="2" fill={sc} />
        <path d="M14 28V14a2 2 0 012-2h20z" fill={W} opacity="0.3" />
        <rect x="4" y="45" width="56" height="8" rx="4" fill={sd} />
        <rect x="4" y="41" width="56" height="8" rx="4" fill={lt} />
      </>); break;
    case 'box':
      body = (<>
        <path d="M8 22L32 10l24 12-24 12z" fill={lt} />
        <path d="M8 22l24 12v26L8 48z" fill={em} />
        <path d="M56 22L32 34v26l24-12z" fill={fr} />
        <path d="M20 16l24 12" stroke={sd} strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      </>); break;
    case 'pin':
      body = (<>
        <ellipse cx="32" cy="58" rx="14" ry="3.5" fill={sd} opacity="0.3" />
        <path d="M32 4C21 4 13 12 13 22c0 14 19 34 19 34s19-20 19-34C51 12 43 4 32 4z" fill={em} />
        <path d="M32 4C21 4 13 12 13 22c0 3 1 6 2 9 4-11 13-19 29-17C40 8 36 4 32 4z" fill={W} opacity="0.25" />
        <circle cx="32" cy="22" r="8" fill={sd} />
        <circle cx="32" cy="22" r="4" fill={sc} />
      </>); break;
    case 'bell':
      body = (<>
        <rect x="29" y="2" width="6" height="7" rx="3" fill={fr} />
        <path d="M32 7c-10 0-16 8-16 18v10l-5 8h42l-5-8V25c0-10-6-18-16-18z" fill={em} />
        <path d="M20 27c0-8 5-14 12-15" stroke={W} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
        <path d="M25 49a7 7 0 0014 0z" fill={sd} />
      </>); break;
    case 'user':
      body = (<>
        <path d="M8 60c0-15 10-24 24-24s24 9 24 24z" fill={fr} />
        <path d="M8 60c0-15 10-24 24-24 4 0 8 1 11 3-14 0-25 8-25 21z" fill={W} opacity="0.2" />
        <circle cx="32" cy="21" r="12" fill={em} />
        <circle cx="32" cy="21" r="12" fill="none" stroke={W} strokeWidth="1" opacity="0.3" />
      </>); break;
    default: // store
      body = (<>
        <rect x="10" y="26" width="46" height="34" rx="4" fill={sd} />
        <rect x="8" y="24" width="46" height="34" rx="4" fill={lt} />
        <rect x="26" y="38" width="14" height="20" rx="2" fill={fr} />
        <rect x="12" y="32" width="10" height="10" rx="2" fill={sc} />
        <path d="M6 24l5-16h42l5 16z" fill={em} />
        <path d="M6 24h52v5a8 8 0 01-13 0 8 8 0 01-13 0 8 8 0 01-13 0 8 8 0 01-13 0z" fill={fr} />
      </>);
  }
  return <svg viewBox="0 0 64 64" className={`drop-shadow-[0_6px_5px_rgba(2,44,34,0.35)] ${className}`} aria-hidden="true">{body}</svg>;
});

/* decorative cluster of glyphs (was ShopScene in Shops.jsx) */
export const Scene3D = memo(({ className = 'w-40 h-32', compact = false, main = 'store', float = 'phone', extra = 'wrench' }) => (
  <div className={`relative flex-shrink-0 ${className}`} aria-hidden="true">
    <div className="absolute inset-x-3 bottom-0 h-4 rounded-full bg-emerald-900/25 blur-md" />
    <Glyph3D kind={main} className="absolute bottom-1 left-0 h-[78%] w-[62%]" />
    <Glyph3D kind={float} className="anim-float absolute right-[10%] top-0 h-[72%] w-[28%]" />
    {!compact && <Glyph3D kind={extra} className="absolute bottom-0 right-0 h-[40%] w-[24%]" />}
  </div>
));

/* ───────────── buttons / chips / rows ───────────── */
export const Btn3D = memo(({ as: Tag = 'button', tone = 'em', darkMode, className = '', children, ...rest }) => {
  const tones = {
    em: 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_4px_0_0_#047857,0_10px_16px_-8px_rgba(5,150,105,0.6)] hover:from-emerald-300 hover:to-emerald-500 active:shadow-[0_1px_0_0_#047857]',
    soft: darkMode
      ? 'bg-gray-800 text-gray-200 border border-gray-700 shadow-[0_4px_0_0_#030712] hover:bg-gray-700 active:shadow-[0_1px_0_0_#030712]'
      : 'bg-white text-gray-700 border border-gray-200 shadow-[0_4px_0_0_#d1d5db] hover:bg-gray-50 active:shadow-[0_1px_0_0_#d1d5db]',
    danger: 'bg-gradient-to-b from-rose-400 to-rose-600 text-white ring-1 ring-inset ring-white/30 shadow-[0_4px_0_0_#9f1239,0_10px_16px_-8px_rgba(225,29,72,0.6)] hover:from-rose-300 hover:to-rose-500 active:shadow-[0_1px_0_0_#9f1239]',
  };
  return (
    <Tag
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-all duration-100 active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export const Chip3D = ({ children, className = '' }) => (
  <span className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-600 text-white shadow-[0_3px_0_0_#047857] ${className}`}>
    <span className="drop-shadow-[0_2px_1px_rgba(0,0,0,0.35)]">{children}</span>
  </span>
);

export const InfoRow = ({ icon: Icon, children, darkMode }) => (
  <p className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
    <span className="truncate">{children}</span>
  </p>
);

/* ───────────── trust strip ───────────── */
const DEFAULT_TRUST = [
  { icon: RiVerifiedBadgeLine, title: 'Verified shops', text: 'Checked by our team' },
  { icon: FiTool, title: 'Certified repairs', text: '12-month warranty' },
  { icon: FiRefreshCw, title: 'Trade-in credit', text: 'Instant estimates' },
  { icon: FiShield, title: 'Safe recycling', text: 'Less e-waste' },
];

export const TrustStrip = memo(({ darkMode, items = DEFAULT_TRUST }) => (
  <div className={`border-y ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-5 sm:px-6 md:grid-cols-4 lg:px-8">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="flex items-center gap-3">
          <Chip3D className="h-10 w-10 flex-shrink-0"><Icon className="h-5 w-5" /></Chip3D>
          <div className="min-w-0">
            <p className={`truncate text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
            <p className={`truncate text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{text}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
));

/* ───────────── filters ───────────── */
export const FilterSection = memo(({ title, isOpen, onToggle, darkMode, children }) => (
  <div className={`border-b py-4 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
    <button type="button" onClick={onToggle} aria-expanded={isOpen}
      className={`flex w-full items-center justify-between text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
      {title}
      <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
    </button>
    <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  </div>
));

export const OptionRow = memo(({ type, label, count, selected, onClick, darkMode, icon }) => (
  <button type="button" role={type === 'radio' ? 'radio' : 'checkbox'} aria-checked={selected} onClick={onClick}
    className="group flex w-full items-center gap-3 rounded-md py-1.5 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400">
    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border-2 transition-colors ${type === 'radio' ? 'rounded-full' : 'rounded'} ${
      selected ? `border-emerald-500 ${type === 'check' ? 'bg-emerald-500' : ''}` : darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
      {selected && (type === 'radio' ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : <FiCheck className="h-3 w-3 text-white" />)}
    </span>
    <span className={`flex flex-1 items-center gap-1.5 truncate text-sm ${selected ? 'font-semibold text-emerald-500' : darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'}`}>{icon}{label}</span>
    {count !== undefined && <span className={`text-xs tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{count}</span>}
  </button>
));

export const Pill = memo(({ label, active, onClick, darkMode }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${active ? 'border-emerald-500 bg-emerald-500 text-white' : darkMode ? 'border-gray-700 text-gray-300 hover:border-emerald-500' : 'border-gray-200 text-gray-600 hover:border-emerald-500'}`}>
    {label}
  </button>
));

/* ───────────── pagination ───────────── */
export function getPaginationRange(current, total) {
  if (total <= 1) return [1];
  const middle = [];
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) middle.push(i);
  const range = [1];
  if (current - 1 > 2) range.push('…');
  range.push(...middle);
  if (current + 1 < total - 1) range.push('…');
  range.push(total);
  return range;
}

export const PageBtn = memo(({ children, active, darkMode, ...rest }) => (
  <button type="button" aria-current={active ? 'page' : undefined} {...rest}
    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold transition-all duration-100 active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 ${
      active ? 'bg-emerald-500 text-white shadow-[0_3px_0_0_#047857]'
        : darkMode ? 'bg-gray-800 text-gray-300 shadow-[0_3px_0_0_#030712] hover:text-emerald-400' : 'border border-gray-200 bg-white text-gray-600 shadow-[0_3px_0_0_#d1d5db] hover:text-emerald-700'}`}>
    {children}
  </button>
));

/* ready-made pager: <Pagination3D page total onChange darkMode /> */
export const Pagination3D = memo(({ page, total, onChange, darkMode }) => {
  if (total <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <PageBtn darkMode={darkMode} aria-label="Previous page" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))}><FiChevronLeft className="h-4 w-4 rtl:rotate-180" /></PageBtn>
      {getPaginationRange(page, total).map((pg, i) => pg === '…'
        ? <span key={`d${i}`} className={`w-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>…</span>
        : <PageBtn key={pg} darkMode={darkMode} active={page === pg} onClick={() => onChange(pg)}>{pg}</PageBtn>)}
      <PageBtn darkMode={darkMode} aria-label="Next page" disabled={page === total} onClick={() => onChange(Math.min(total, page + 1))}><FiChevronRight className="h-4 w-4 rtl:rotate-180" /></PageBtn>
    </nav>
  );
});

/* ───────────── forms ───────────── */
export const Select3D = memo(({ darkMode, className = '', children, ...rest }) => (
  <select className={`${inputCls(darkMode)} ${className}`} {...rest}>{children}</select>
));

export const Field = ({ label, darkMode, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className={`mb-1 block text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
    {children}
  </label>
);

/* ───────────── feedback ───────────── */
export const EmptyState = memo(({ kind = 'box', title, subtitle, darkMode, children }) => (
  <div className={`${cardCls(darkMode)} px-6 py-12 text-center`}>
    <span className={`mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl ${tileCls(darkMode)}`}>
      <Glyph3D kind={kind} className="h-14 w-14" />
    </span>
    <p className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</p>
    {subtitle && <p className={`mx-auto mt-1 max-w-xs text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
));

/* progress < 0 means cancelled / failed */
export const ProgressBar3D = memo(({ progress, label, darkMode }) => {
  const bad = progress < 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`truncate text-[10px] font-bold uppercase tracking-wide ${bad ? 'text-rose-500' : 'text-emerald-500'}`}>{label}</span>
        {!bad && <span className={`text-[10px] font-bold tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{progress}%</span>}
      </div>
      <div className={`h-1.5 overflow-hidden rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={bad ? 0 : progress}>
        <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${bad ? 'w-full bg-gradient-to-r from-rose-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`} style={bad ? undefined : { width: `${progress}%` }} />
      </div>
    </div>
  );
});

/* bottom-sheet on mobile, centered card on desktop. Dialog handles focus trap / Esc / scroll lock */
export const Modal3D = ({ open, onClose, title, icon: Icon, darkMode, size = 'sm:max-w-lg', children, footer }) => (
  <Dialog open={open} onClose={onClose} className="relative z-[60]">
    <DialogBackdrop className="fixed inset-0 bg-black/60" />
    <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
      <DialogPanel className={`anim-fade-up relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl border shadow-2xl sm:rounded-3xl ${size} ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white'}`}>
        <div className={`flex items-center gap-3 p-4 ${darkMode ? 'bg-gradient-to-br from-emerald-900 to-gray-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-100'}`}>
          {Icon && <Chip3D className="h-9 w-9 flex-shrink-0"><Icon className="h-4 w-4" /></Chip3D>}
          <DialogTitle className={`min-w-0 flex-1 truncate text-base font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</DialogTitle>
          <button type="button" onClick={onClose} aria-label="Close"
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
            <FiX className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer && <div className={`border-t p-4 ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>{footer}</div>}
      </DialogPanel>
    </div>
  </Dialog>
);