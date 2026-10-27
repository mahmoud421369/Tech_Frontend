/* =====================================================================
   PATCH for Products page – apply the 8 blocks below in order.
   Everything not mentioned stays exactly as in your file.
   ===================================================================== */

/* ── 1. IMPORTS: add useId, and nothing else changes ─────────────────── */
import React, {
  useState, useEffect, useCallback, useRef, useMemo, memo,
  Suspense, lazy, useDeferredValue, useId,
} from 'react';


/* ── 2. REPLACE `safeImageUrl` with this ─────────────────────────────────
   DB stores a file name / relative path (e.g. "laptop1.png" or "uploads/laptop1.png").
   We rebuild it as  <API_ORIGIN>/uploads/<file>  and block traversal / bad schemes.
   Set VITE_API_URL (or api.defaults.baseURL) to your backend origin.      */
const API_ORIGIN = String(
  api?.defaults?.baseURL || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || ''
).replace(/\/+$/, '');

const safeImageUrl = (value) => {
  if (typeof value !== 'string') return '';
  let u = value.trim().replace(/\\/g, '/');
  if (!u) return '';
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u)) return u;       // inline (no svg: can carry scripts)
  if (/^https?:\/\//i.test(u)) return u;                                      // already absolute
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith('//')) return '';       // javascript:, file:, protocol-relative…
  const parts = u.split('/').filter((s) => s && s !== 'uploads' && s !== '.');
  if (!parts.length || parts.includes('..')) return '';                       // path traversal
  if (!/\.(png|jpe?g|webp|gif|avif)$/i.test(parts[parts.length - 1])) return '';
  return `${API_ORIGIN}/uploads/${parts.map(encodeURIComponent).join('/')}`;
};


/* ── 3. ADD small helpers + extra CSS ────────────────────────────────────
   (a) in `pageStyles`, append these lines before the closing backtick:     */
//   .anim-float-slow { animation: floatY 9s ease-in-out infinite; }
//   @keyframes waveX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
//   .anim-wave { animation: waveX 14s linear infinite; }
//   .anim-wave-rev { animation: waveX 22s linear infinite reverse; }
//   and add `.anim-float-slow, .anim-wave, .anim-wave-rev` to the reduced-motion rule.

/*   (b) in `kindOf`, add before `return 'box'`:                              */
//   if (k.includes('game') || k.includes('console')) return 'gaming';
//   if (k.includes('camera') || k.includes('photo')) return 'camera';
/*   (c) in Glyph3D `switch`, add before `default:`                           */
//   case 'gaming':
//     body = (<>
//       <rect x="8" y="22" width="52" height="30" rx="15" fill={sd} />
//       <rect x="5" y="18" width="52" height="30" rx="15" fill={fr} />
//       <rect x="14" y="30" width="14" height="4" rx="2" fill={W} />
//       <rect x="19" y="25" width="4" height="14" rx="2" fill={W} />
//       <circle cx="42" cy="28" r="3.5" fill={sc} /><circle cx="49" cy="35" r="3.5" fill={em} />
//     </>); break;
//   case 'camera':
//     body = (<>
//       <rect x="8" y="20" width="52" height="34" rx="8" fill={sd} />
//       <rect x="5" y="16" width="52" height="34" rx="8" fill={fr} />
//       <rect x="20" y="10" width="14" height="8" rx="3" fill={em} />
//       <circle cx="31" cy="33" r="12" fill={sc} /><circle cx="31" cy="33" r="6" fill={sd} />
//       <path d="M24 28a9 9 0 019-4" stroke={W} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
//     </>); break;


/* ── 4. ADD Dropdown (Tailwind, accessible – replaces both <select>s) ──── */
const Dropdown = memo(({ value, options, onChange, label, darkMode, className = '' }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown); };
  }, [open]);

  const openMenu = () => { setActive(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); };
  const pick = (o) => { onChange(o.value); setOpen(false); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return openMenu();
      setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % options.length : (i - 1 + options.length) % options.length));
    } else if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault(); pick(options[active]);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`} onKeyDown={onKeyDown}>
      <button type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400 ${
          darkMode ? 'border-gray-700 bg-gray-800 text-gray-200 hover:border-emerald-600' : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-400'}`}>
        <span className="truncate">{current?.label}</span>
        <FiChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
      </button>
      {open && (
        <ul id={listId} role="listbox" aria-label={label}
          className={`absolute right-0 z-30 mt-2 max-h-64 w-full min-w-[11rem] overflow-auto rounded-xl border p-1 shadow-xl ${
            darkMode ? 'border-gray-700 bg-gray-800 shadow-black/40' : 'border-gray-200 bg-white shadow-gray-300/50'}`}>
          {options.map((o, i) => {
            const sel = o.value === value;
            return (
              <li key={o.value} role="option" aria-selected={sel} onMouseEnter={() => setActive(i)} onClick={() => pick(o)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                  i === active ? (darkMode ? 'bg-gray-700' : 'bg-emerald-50') : ''} ${sel ? 'font-semibold text-emerald-500' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {o.label}{sel && <FiCheck className="h-4 w-4" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

/* Replace the two <select> elements in the toolbar with: */
// <Dropdown label="Sort products" value={sortBy} onChange={setSortBy} darkMode={darkMode} className="w-48"
//   options={Object.entries(sortLabels).map(([value, label]) => ({ value, label }))} />
// <Dropdown label="Items per page" value={pageSize} onChange={setPageSize} darkMode={darkMode} className="hidden w-32 sm:block"
//   options={[12, 24, 48].map((n) => ({ value: n, label: `${n} / page` }))} />


/* ── 5. REPLACE `CategoryGrid` – light-gray section, white cards, 3D art ─ */
const CategoryGrid = memo(({ categories, productsByCategory, selectedCategoryId, onSelect, darkMode }) => {
  const top = useMemo(
    () => [...categories].sort((a, b) => (productsByCategory[b.id]?.length || 0) - (productsByCategory[a.id]?.length || 0)).slice(0, 6),
    [categories, productsByCategory]
  );
  if (!top.length) return null;

  return (
    <section className={`py-12 sm:py-16 ${darkMode ? 'bg-gray-950' : 'bg-gray-100'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div>
            <h2 className={`text-2xl font-bold tracking-tight sm:text-3xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>Browse categories</h2>
            <p className={`mt-1.5 text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Pick a device type to filter the list below.</p>
          </div>
          <Btn3D tone="em" onClick={() => onSelect('all')} className="px-4 py-2 text-sm">
            All categories <FiArrowRight className="h-4 w-4" />
          </Btn3D>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
          {top.map((cat) => {
            const active = selectedCategoryId === cat.id;
            const count = productsByCategory[cat.id]?.length || 0;
            return (
              <button key={cat.id} type="button" onClick={() => onSelect(cat.id)} aria-pressed={active}
                className={`group flex flex-col items-center gap-3 rounded-2xl border p-3 text-center transition-all duration-150 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 sm:p-4 ${
                  darkMode ? 'bg-gray-900' : 'bg-white'} ${
                  active ? 'border-emerald-500 ring-2 ring-emerald-500/30' : darkMode ? 'border-gray-700 hover:border-emerald-600' : 'border-gray-200 hover:border-emerald-400'}`}>
                <span className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <span className={`absolute h-3/4 w-3/4 rounded-full blur-2xl ${darkMode ? 'bg-emerald-500/15' : 'bg-emerald-300/40'}`} />
                  <Glyph3D name={cat.name} className="relative h-3/5 w-3/5 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-110" />
                </span>
                <span className={`line-clamp-1 w-full text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cat.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  active ? 'bg-emerald-500 text-white' : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{count} items</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
});


/* ── 6. ADD ArrivalsHeader (wavy banner + floating icons) ───────────────── */
const ArrivalsHeader = memo(({ darkMode, children }) => {
  const wave = 'M0 60c120-40 240-40 360 0s240 40 360 0 240-40 360 0 240 40 360 0V120H0z';
  const sectionBg = darkMode ? '#111827' : '#ffffff';
  const floaters = [
    ['phone', 'left-[4%] top-[14%] h-14 w-8 sm:h-20 sm:w-12', 'anim-float', '0s'],
    ['watch', 'left-[44%] top-[10%] hidden h-12 w-10 sm:block', 'anim-float-slow', '1.2s'],
    ['audio', 'right-[22%] top-[18%] h-14 w-14 sm:h-16 sm:w-16', 'anim-float', '0.6s'],
    ['laptop', 'right-[4%] top-[22%] hidden h-20 w-24 md:block', 'anim-float-slow', '2s'],
  ];
  return (
    <div className={`relative mb-8 overflow-hidden rounded-3xl ${darkMode ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'}`}>
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      {floaters.map(([n, pos, anim, delay]) => (
        <Glyph3D key={n} name={n} className={`pointer-events-none absolute opacity-90 ${anim} ${pos}`} style={{ animationDelay: delay }} />
      ))}
      <div className="relative px-6 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-10">{children}</div>
      {/* two scrolling wave layers; 200%-wide so the loop is seamless */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden sm:h-20" aria-hidden="true">
        <svg className="anim-wave-rev absolute bottom-0 h-full w-[200%] opacity-40" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d={wave} fill={sectionBg} /></svg>
        <svg className="anim-wave absolute bottom-0 h-3/4 w-[200%]" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d={wave} fill={sectionBg} /></svg>
      </div>
    </div>
  );
});
/* NOTE: Glyph3D must forward `style`: change its signature to
   ({ name = '', className = 'w-10 h-10', style })  and add  style={style}  on its <svg>. */

/* In the "Latest arrivals" section, replace the whole `relative mb-8 overflow-hidden rounded-3xl …` div with: */
// <ArrivalsHeader darkMode={darkMode}>
//   <div className="max-w-md">
//     <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white"><FiTag className="h-3 w-3" /> Just in</span>
//     <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Latest arrivals</h2>
//     <p className="mt-1 text-sm text-emerald-50/80">Freshly listed and ready to ship.</p>
//     {showSliderArrows && <div className="mt-4 flex gap-2">{arrowBtn('left', !canScrollLeft)}{arrowBtn('right', !canScrollRight)}</div>}
//   </div>
// </ArrivalsHeader>


/* ── 7. FILTER PANEL – responsive tweaks ─────────────────────────────────
   a) PriceRangeFilter: change the Min/Max wrapper to
        <div className="flex flex-col gap-2 min-[380px]:flex-row">
   b) FilterPanel root: add `w-full` and use `p-4 sm:p-5`.
   c) Replace the mobile drawer block (inside <AnimatePresence>) with a
      bottom sheet on phones / side drawer on tablets:                      */
// {isSidebarOpen && (
//   <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
//       className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
//     <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'tween', duration: 0.22 }}
//       className={`absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl sm:inset-y-0 sm:left-0 sm:right-auto sm:max-h-none sm:w-96 sm:rounded-none ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
//       <div className="flex items-center justify-between px-4 pb-2 pt-4">
//         <h3 className={`text-base font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
//         <Btn3D tone="soft" darkMode={darkMode} onClick={() => setIsSidebarOpen(false)} aria-label="Close filters" className="h-9 w-9"><FiX className="h-5 w-5" /></Btn3D>
//       </div>
//       <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4"><FilterPanel {...filterPanelProps} /></div>
//       <div className={`border-t p-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
//         <Btn3D onClick={() => { setIsSidebarOpen(false); scrollToGrid(); }} className="w-full py-3 text-sm">Show {filteredProducts.length} items</Btn3D>
//       </div>
//     </motion.div>
//   </div>
// )}


/* ── 8. SMALL SECURITY / PERF NOTES (already applied above) ──────────────
   • Images: only /uploads/<encoded file> or http(s); traversal, javascript:, svg data URIs rejected.
   • Backend: serve /uploads with `X-Content-Type-Options: nosniff` and only image MIME types.
   • <img> keeps loading="lazy", decoding="async", width/height (no layout shift), referrerPolicy.
   • Dropdown listeners attach only while open; all new components are memoized.
   • Waves/floaters are CSS-only transforms (GPU) and disabled under prefers-reduced-motion.
*/