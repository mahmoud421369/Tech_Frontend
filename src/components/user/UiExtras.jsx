/**
 * components/UiExtras.jsx
 * Drop-in extras for the Account page:
 *  - toast / Toaster ........ modern success/error messages (no dependency, no timers)
 *  - Dropdown ............... accessible Tailwind replacement for <select> (portal, flips up near edges)
 *  - TextField / DateField .. modern inputs with floating labels
 *  - Tile3D ................. glossy 3D icon tiles
 *  - PersonIllustration ..... 3D "clay" person illustration
 *  - EmptyState3D ........... 3D illustrated empty states (box, wrench, pin, bell, chart)
 *  - EXTRAS_CSS ............. the few keyframes these need (render once in a <style>)
 */
import React, { memo, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { FiAlertTriangle, FiCalendar, FiCheck, FiChevronDown, FiInfo, FiX } from 'react-icons/fi';

/* ───────────── css ───────────── */
export const EXTRAS_CSS = `
@keyframes il-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
.il-float{animation:il-float 4.5s ease-in-out infinite}
.il-float-2{animation:il-float 5.5s ease-in-out -1.5s infinite}
@keyframes dd-in{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:none}}
@keyframes dd-in-up{from{opacity:0;transform:translateY(6px) scale(.97)}to{opacity:1;transform:none}}
.dd-in{animation:dd-in .14s ease-out}
.dd-in-up{animation:dd-in-up .14s ease-out}
@keyframes toast-in{from{opacity:0;transform:translateY(-12px) scale(.96)}to{opacity:1;transform:none}}
.toast-in{animation:toast-in .3s cubic-bezier(.2,.9,.3,1.15)}
@keyframes toast-pop{0%{transform:scale(.4)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.toast-pop{animation:toast-pop .45s cubic-bezier(.2,.9,.3,1.3) .08s both}
@keyframes toast-check{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}
.toast-check{stroke-dasharray:24;animation:toast-check .35s ease-out .25s both}
@keyframes toast-bar{from{transform:scaleX(1)}to{transform:scaleX(0)}}
.toast-bar{transform-origin:left;animation:toast-bar linear forwards}
[dir=rtl] .toast-bar{transform-origin:right}
.toast-root:hover .toast-bar{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){
  .il-float,.il-float-2,.dd-in,.dd-in-up,.toast-in,.toast-pop{animation:none}
  .toast-check{animation:none;stroke-dashoffset:0}
}
`;

/* ───────────── toasts ───────────── */
let toasts = [];
const listeners = new Set();
let seq = 0;
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => toasts;

export const dismissToast = (id) => { toasts = toasts.filter((t) => t.id !== id); emit(); };
const clearToasts = () => { toasts = []; emit(); };

export const notify = ({ type = 'success', title, message, duration = 3200 }) => {
  const id = ++seq;
  toasts = [...toasts.slice(-3), { id, type, title, message, duration }];
  emit();
  return id;
};

/** Same shape the page already used with SweetAlert: toast({ icon, title, text, timer }) */
export const toast = ({ icon = 'success', title, text, timer } = {}) =>
  notify({ type: icon, title, message: text, duration: timer ? Math.max(timer, 2600) : 3200 });

const TOAST_STYLE = {
  success: { Icon: FiCheck, badge: 'from-emerald-300 to-emerald-600 shadow-emerald-600/40', bar: 'bg-emerald-500' },
  error: { Icon: FiX, badge: 'from-rose-300 to-rose-600 shadow-rose-600/40', bar: 'bg-rose-500' },
  warning: { Icon: FiAlertTriangle, badge: 'from-amber-300 to-amber-500 shadow-amber-600/40', bar: 'bg-amber-500' },
  info: { Icon: FiInfo, badge: 'from-sky-300 to-sky-600 shadow-sky-600/40', bar: 'bg-sky-500' },
  question: { Icon: FiInfo, badge: 'from-sky-300 to-sky-600 shadow-sky-600/40', bar: 'bg-sky-500' },
};

const ToastItem = memo(({ item, darkMode }) => {
  const s = TOAST_STYLE[item.type] || TOAST_STYLE.info;
  return (
    <div
      role={item.type === 'error' ? 'alert' : 'status'}
      className={`toast-root toast-in pointer-events-auto relative w-full overflow-hidden rounded-2xl border p-3 pe-10 shadow-xl backdrop-blur-md sm:w-[22rem] ${
        darkMode ? 'border-gray-700/70 bg-gray-900/90 text-white shadow-black/40' : 'border-gray-200 bg-white/95 text-gray-900 shadow-gray-300/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`toast-pop flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_6px_12px_-4px] ring-1 ring-inset ring-white/40 ${s.badge}`}>
          {item.type === 'success' ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path className="toast-check" d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : <s.Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-bold leading-snug">{item.title}</p>
          {item.message && <p className={`mt-0.5 text-xs leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.message}</p>}
        </div>
      </div>
      <button type="button" onClick={() => dismissToast(item.id)} aria-label="Dismiss"
        className={`absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${darkMode ? 'text-gray-500 hover:bg-white/10 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}>
        <FiX className="h-3.5 w-3.5" />
      </button>
      {/* the bar's CSS animation is the timer: when it ends, the toast goes (hover pauses it) */}
      <span className={`absolute inset-x-0 bottom-0 h-[3px] ${darkMode ? 'bg-white/5' : 'bg-black/5'}`}>
        <span className={`toast-bar block h-full ${s.bar}`} style={{ animationDuration: `${item.duration}ms` }} onAnimationEnd={() => dismissToast(item.id)} />
      </span>
    </div>
  );
});

export const Toaster = memo(({ darkMode }) => {
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => clearToasts, []); // never show stale toasts after a remount
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[10000] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-4 sm:top-4 sm:items-end">
      {list.map((item) => <ToastItem key={item.id} item={item} darkMode={darkMode} />)}
    </div>
  );
});

/* ───────────── dropdown (replaces <select>) ───────────── */
export const Dropdown = memo(({ value, onChange, options, placeholder = 'Select…', label, icon: Icon, darkMode, className = '', ariaLabel, disabled = false }) => {
  const uid = useId().replace(/:/g, '');
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [active, setActive] = useState(-1);
  const selectedIndex = options.findIndex((o) => String(o.value) === String(value));
  const selected = options[selectedIndex];

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    const el = btnRef.current;
    if (!el || disabled) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const want = Math.min(256, options.length * 40 + 12);
    const below = vh - r.bottom - 12;
    const up = below < want && r.top > below;
    const width = Math.max(r.width, 176);
    setPos({
      up, width,
      left: Math.min(Math.max(8, r.left), vw - width - 8),
      top: up ? undefined : r.bottom + 6,
      bottom: up ? vh - r.top + 6 : undefined,
      maxHeight: Math.max(120, Math.min(256, up ? r.top - 12 : below)),
      dir: el.closest('[dir]')?.getAttribute('dir') || 'ltr', // the menu lives in <body>, so carry direction + font over
      font: getComputedStyle(el).fontFamily,
    });
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, options.length, selectedIndex]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!btnRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) close(); };
    const onScroll = (e) => { if (!listRef.current?.contains(e.target)) close(); };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open, close]);

  useEffect(() => { if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [open, active]);

  const pick = (i) => {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    close();
    btnRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    const n = options.length;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive((i) => (i + 1) % n); break;
      case 'ArrowUp': e.preventDefault(); setActive((i) => (i - 1 + n) % n); break;
      case 'Home': e.preventDefault(); setActive(0); break;
      case 'End': e.preventDefault(); setActive(n - 1); break;
      case 'Enter': case ' ': e.preventDefault(); pick(active); break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); close(); break; // don't let a parent modal close too
      case 'Tab': close(); break;
      default:
    }
  };

  const btn = darkMode
    ? 'border-gray-700 bg-gray-800/70 text-gray-100 hover:border-gray-600'
    : 'border-gray-200 bg-white/80 text-gray-800 hover:border-gray-300';

  return (
    <div className={`relative ${className}`}>
      {label && <label htmlFor={`${uid}btn`} className={`mb-1.5 block text-xs font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>}
      <button
        ref={btnRef} id={`${uid}btn`} type="button" role="combobox" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${uid}list` : undefined}
        aria-activedescendant={open && active >= 0 ? `${uid}o${active}` : undefined} aria-label={label ? undefined : ariaLabel}
        onClick={() => (open ? close() : openMenu())} onKeyDown={onKeyDown} onKeyUp={(e) => { if (e.key === ' ') e.preventDefault(); }}
        className={`flex h-11 w-full items-center gap-2 rounded-xl border px-3 text-sm font-semibold outline-none transition-[border-color,box-shadow,background-color] duration-150 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50 ${btn} ${open ? 'border-emerald-500 ring-4 ring-emerald-500/15' : ''}`}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0 text-emerald-500" />}
        <span className={`min-w-0 flex-1 truncate text-start ${selected ? '' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{selected ? selected.label : placeholder}</span>
        <FiChevronDown className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-500' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={listRef} id={`${uid}list`} role="listbox" aria-label={ariaLabel || label} dir={pos.dir}
          onMouseDown={(e) => e.preventDefault()} onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight, fontFamily: pos.font }}
          className={`${pos.up ? 'dd-in-up' : 'dd-in'} z-[10001] overflow-y-auto overscroll-contain rounded-2xl border p-1.5 shadow-2xl backdrop-blur-md ${
            darkMode ? 'border-gray-700 bg-gray-900/95 shadow-black/50' : 'border-gray-200 bg-white/95 shadow-gray-300/60'
          }`}
        >
          {options.map((o, i) => {
            const isSel = i === selectedIndex;
            return (
              <div key={String(o.value)} id={`${uid}o${i}`} role="option" aria-selected={isSel} onMouseEnter={() => setActive(i)} onClick={() => pick(i)}
                className={`flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  i === active ? (darkMode ? 'bg-emerald-500/15' : 'bg-emerald-50') : ''} ${isSel ? 'text-emerald-500' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {isSel && <FiCheck className="h-4 w-4 flex-shrink-0" />}
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
});

/* ───────────── inputs ───────────── */
export const TextField = memo(({ label, icon: Icon, darkMode, as: Tag = 'input', className = '', ...props }) => {
  const uid = useId().replace(/:/g, '');
  const id = props.id || uid;
  const tall = Tag === 'textarea';
  const tone = darkMode
    ? 'border-gray-700 bg-gray-800/70 text-white hover:border-gray-600 focus:bg-gray-800 focus:ring-emerald-500/20'
    : 'border-gray-200 bg-white/80 text-gray-900 hover:border-gray-300 focus:bg-white focus:ring-emerald-500/15';
  return (
    <div className={`group relative ${className}`}>
      {Icon && <Icon className="pointer-events-none absolute start-3.5 top-[1.15rem] h-4 w-4 text-gray-400 transition-colors group-focus-within:text-emerald-500" />}
      <Tag
        {...props} id={id} placeholder=" "
        className={`peer block w-full rounded-xl border text-sm font-semibold outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-emerald-500 focus:ring-4 ${
          Icon ? 'ps-10 pe-3.5' : 'px-3.5'} ${tall ? 'min-h-[110px] resize-y pb-2 pt-6' : 'h-[3.4rem] pb-1.5 pt-[1.35rem]'} ${tone}`}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute max-w-[calc(100%-3rem)] truncate transition-[top,font-size,color] duration-150 ${Icon ? 'start-10' : 'start-3.5'} top-[0.55rem] text-[11px] font-bold ${
          darkMode ? 'text-gray-400' : 'text-gray-500'} peer-placeholder-shown:top-[1.05rem] peer-placeholder-shown:text-sm peer-placeholder-shown:font-semibold peer-focus:top-[0.55rem] peer-focus:text-[11px] peer-focus:font-bold peer-focus:text-emerald-500`}
      >
        {label}
      </label>
    </div>
  );
});

export const DateField = memo(({ darkMode, className = '', ...props }) => (
  <div className={`relative ${className}`}>
    <FiCalendar className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
    <input
      type="date" {...props}
      className={`h-11 w-full rounded-xl border ps-9 pe-3 text-sm font-semibold outline-none transition-[border-color,box-shadow] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 ${
        darkMode ? 'border-gray-700 bg-gray-800/70 text-gray-100 [color-scheme:dark] hover:border-gray-600' : 'border-gray-200 bg-white/80 text-gray-800 hover:border-gray-300'}`}
    />
  </div>
));

/* ───────────── 3D icon tile ───────────── */
const TILE = {
  em: 'from-emerald-300 to-emerald-600 shadow-emerald-600/40',
  sky: 'from-sky-300 to-sky-600 shadow-sky-600/40',
  vi: 'from-violet-300 to-violet-600 shadow-violet-600/40',
  am: 'from-amber-300 to-amber-500 shadow-amber-600/40',
  ro: 'from-rose-300 to-rose-600 shadow-rose-600/40',
  te: 'from-teal-300 to-cyan-600 shadow-teal-600/40',
};
export const Tile3D = memo(({ icon: Icon, tone = 'em', className = 'h-10 w-10', iconClassName = 'h-5 w-5' }) => (
  <span className={`relative inline-flex flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_8px_14px_-6px] ring-1 ring-inset ring-white/40 ${TILE[tone] || TILE.em} ${className}`}>
    <span className="pointer-events-none absolute inset-x-1.5 top-1 h-1/3 rounded-full bg-white/35" />
    <Icon className={`relative ${iconClassName}`} />
  </span>
));

/* ───────────── illustrations ───────────── */
const grad = (id, a, b) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>
);

export const PersonIllustration = memo(({ darkMode = false, className = '' }) => {
  const p = useId().replace(/:/g, '');
  const u = (n) => `url(#${p}${n})`;
  const chip = darkMode ? '#111827' : '#ffffff';
  const chipLine = darkMode ? '#374151' : '#e5e7eb';
  return (
    <svg viewBox="0 0 240 260" role="img" aria-label="Account illustration" className={className}>
      <defs>
        <radialGradient id={`${p}glow`} cx="50%" cy="55%" r="55%">
          <stop offset="0" stopColor={darkMode ? '#10b981' : '#6ee7b7'} stopOpacity={darkMode ? 0.28 : 0.6} />
          <stop offset="1" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        {grad(`${p}base`, darkMode ? '#065f46' : '#6ee7b7', darkMode ? '#022c22' : '#10b981')}
        {grad(`${p}top`, darkMode ? '#047857' : '#ecfdf5', darkMode ? '#064e3b' : '#6ee7b7')}
        {grad(`${p}body`, '#34d399', '#047857')}
        {grad(`${p}hair`, '#5b3a29', '#24160f')}
        <radialGradient id={`${p}skin`} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#fde2c8" /><stop offset="1" stopColor="#e9a97c" /></radialGradient>
      </defs>

      <circle cx="120" cy="130" r="112" fill={u('glow')} />

      {/* platform */}
      <rect x="28" y="216" width="184" height="12" fill={u('base')} />
      <ellipse cx="120" cy="228" rx="92" ry="22" fill={u('base')} />
      <ellipse cx="120" cy="216" rx="92" ry="22" fill={u('top')} />
      <ellipse cx="120" cy="216" rx="70" ry="15" fill="none" stroke="#fff" strokeOpacity=".55" strokeDasharray="4 6" />
      <ellipse cx="120" cy="218" rx="52" ry="9" fill="#000" opacity=".12" />

      {/* body */}
      <path d="M58 218C58 172 84 152 120 152s62 20 62 66Z" fill={u('body')} />
      <path d="M72 192c4-22 22-32 40-35-18 10-28 20-32 40Z" fill="#fff" opacity=".25" />
      <rect x="107" y="126" width="26" height="32" rx="12" fill="#d99569" />
      <path d="M103 153h34l-17 22Z" fill="#d99569" />
      <path d="M103 153l17 22-24-12Zm34 0l-17 22 24-12Z" fill="#ecfdf5" opacity=".9" />

      {/* head */}
      <ellipse cx="81" cy="106" rx="6.5" ry="9.5" fill={u('skin')} />
      <ellipse cx="159" cy="106" rx="6.5" ry="9.5" fill={u('skin')} />
      <circle cx="120" cy="102" r="40" fill={u('skin')} />
      <path d="M79 106C72 64 100 48 124 50c28 2 42 28 36 56-6-16-14-26-26-30-10 8-32 10-44 20-3 2-5 6-11 10Z" fill={u('hair')} />
      <path d="M96 62c8-6 18-8 28-7" stroke="#fff" strokeOpacity=".25" strokeWidth="4" strokeLinecap="round" fill="none" />
      <ellipse cx="106" cy="107" rx="3.4" ry="4.4" fill="#2b1d14" />
      <ellipse cx="134" cy="107" rx="3.4" ry="4.4" fill="#2b1d14" />
      <circle cx="107.2" cy="105.4" r="1.1" fill="#fff" />
      <circle cx="135.2" cy="105.4" r="1.1" fill="#fff" />
      <path d="M99 96q7-4 14-1M127 95q7-3 14 1" stroke="#3a261a" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M120 109q-3 7 1 8" stroke="#c98458" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M108 121q12 10 24 0" stroke="#a9573b" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="96" cy="117" r="6" fill="#ff8a80" opacity=".3" />
      <circle cx="144" cy="117" r="6" fill="#ff8a80" opacity=".3" />

      {/* floating chips */}
      <g transform="translate(150 34)">
        <g className="il-float">
          <rect width="68" height="36" rx="18" fill={chip} stroke={chipLine} />
          <circle cx="18" cy="18" r="11" fill="#10b981" />
          <path d="M13 18.5l3.5 3.5 6-7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="36" y="11" width="22" height="4.5" rx="2.2" fill={chipLine} />
          <rect x="36" y="20" width="15" height="4.5" rx="2.2" fill={chipLine} />
        </g>
      </g>
      <g transform="translate(8 104)">
        <g className="il-float-2">
          <rect width="62" height="36" rx="18" fill={chip} stroke={chipLine} />
          <circle cx="18" cy="18" r="11" fill="#8b5cf6" />
          <path d="M18 11.5l2 4.4 4.7.5-3.5 3.2 1 4.7-4.2-2.4-4.2 2.4 1-4.7-3.5-3.2 4.7-.5Z" fill="#fff" />
          <rect x="35" y="11" width="18" height="4.5" rx="2.2" fill={chipLine} />
          <rect x="35" y="20" width="12" height="4.5" rx="2.2" fill={chipLine} />
        </g>
      </g>
      <g className="il-float-2"><path d="M204 118l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#fbbf24" /></g>
      <g className="il-float"><path d="M36 58l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#38bdf8" /></g>
    </svg>
  );
});

const ILLUS = {
  box: (u) => (
    <>
      <polygon points="62,66 100,46 138,66 100,86" fill={u('a1')} />
      <polygon points="62,66 100,86 100,128 62,108" fill={u('a2')} />
      <polygon points="138,66 100,86 100,128 138,108" fill={u('a3')} />
      <polygon points="82,56 94,50 118,62 106,68" fill="#fff" opacity=".55" />
      <polygon points="108,100 128,90 128,100 108,110" fill="#fff" opacity=".6" />
    </>
  ),
  wrench: (u) => (
    <>
      <g transform="translate(84 80)">
        <circle r="34" fill="none" stroke={u('e1')} strokeWidth="14" strokeDasharray="8.9 8.9" />
        <circle r="28" fill={u('e1')} />
        <circle r="11" fill="#ecfdf5" />
        <circle cx="-9" cy="-11" r="6" fill="#fff" opacity=".28" />
      </g>
      <rect x="120" y="82" width="38" height="64" rx="9" fill={u('s1')} />
      <rect x="125" y="90" width="28" height="44" rx="5" fill="#e0f2fe" opacity=".9" />
      <circle cx="139" cy="140" r="2.6" fill="#fff" opacity=".8" />
    </>
  ),
  pin: (u) => (
    <>
      <path d="M100 30C77 30 60 48 60 70c0 28 40 66 40 66s40-38 40-66c0-22-17-40-40-40Z" fill={u('r1')} />
      <circle cx="100" cy="70" r="16" fill="#fff" />
      <path d="M76 52c6-8 16-12 26-11-12 4-20 12-24 24Z" fill="#fff" opacity=".3" />
    </>
  ),
  bell: (u) => (
    <>
      <circle cx="100" cy="34" r="7" fill={u('a2')} />
      <path d="M100 40C77 40 66 58 66 82v20l-10 14h88l-10-14V82c0-24-11-42-34-42Z" fill={u('a1')} />
      <path d="M78 62c4-10 12-16 22-17-10 6-16 14-18 28Z" fill="#fff" opacity=".4" />
      <circle cx="100" cy="126" r="10" fill={u('a2')} />
      <circle cx="132" cy="50" r="11" fill="#f43f5e" stroke="#fff" strokeWidth="3" />
    </>
  ),
  chart: (u) => (
    <>
      <rect x="50" y="96" width="28" height="44" rx="9" fill={u('e1')} />
      <rect x="86" y="68" width="28" height="72" rx="9" fill={u('v1')} />
      <rect x="122" y="40" width="28" height="100" rx="9" fill={u('s1')} />
      <rect x="55" y="101" width="7" height="30" rx="3.5" fill="#fff" opacity=".3" />
      <rect x="91" y="73" width="7" height="58" rx="3.5" fill="#fff" opacity=".3" />
      <rect x="127" y="45" width="7" height="86" rx="3.5" fill="#fff" opacity=".3" />
    </>
  ),
};

export const EmptyState3D = memo(({ kind = 'box', title, subtitle, darkMode, children }) => {
  const p = useId().replace(/:/g, '');
  const u = (n) => `url(#${p}${n})`;
  return (
    <div className={`flex flex-col items-center rounded-3xl border border-dashed px-6 py-8 text-center ${darkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white/60'}`}>
      <svg viewBox="0 0 200 170" aria-hidden="true" className="h-36 w-44">
        <defs>
          {grad(`${p}a1`, '#fde68a', '#fbbf24')}{grad(`${p}a2`, '#fbbf24', '#d97706')}{grad(`${p}a3`, '#f59e0b', '#b45309')}
          {grad(`${p}e1`, '#6ee7b7', '#059669')}{grad(`${p}r1`, '#fda4af', '#e11d48')}
          {grad(`${p}v1`, '#c4b5fd', '#7c3aed')}{grad(`${p}s1`, '#7dd3fc', '#0284c7')}
        </defs>
        <ellipse cx="100" cy="86" rx="78" ry="70" fill={darkMode ? '#10b981' : '#a7f3d0'} opacity={darkMode ? 0.08 : 0.35} />
        <ellipse cx="100" cy="148" rx="56" ry="9" fill="#000" opacity=".1" />
        <g className="il-float">{(ILLUS[kind] || ILLUS.box)(u)}</g>
      </svg>
      <h3 className={`mt-1 text-base font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      {subtitle && <p className={`mt-1 max-w-sm text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
      {children}
    </div>
  );
});