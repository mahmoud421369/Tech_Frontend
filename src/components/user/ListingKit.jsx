import React, { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FiCheck, FiChevronDown, FiX } from 'react-icons/fi';
import api from '../../common/api/api';
import { Glyph3D, FilterSection, PageBtn, getPaginationRange } from './Ui3D';



export const readStorage = (key) => {
  try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; } catch { return null; }
};

export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
export const priceStep = (max) => (max > 50000 ? 1000 : max > 5000 ? 100 : 10);
export const finalPrice = (p) => (p.discount > 0 ? p.price * (1 - p.discount / 100) : Number(p.price) || 0);



export const clean = (v, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');




const API_ORIGIN = (() => {
  const raw = String(
    api?.defaults?.baseURL || (typeof import.meta !== 'undefined' && import.meta.env?.REACT_APP_API_URL) || ''
  ).trim();
  if (!/^https?:\/\//i.test(raw)) return '';
  try { return new URL(raw).origin; } catch { return ''; }
})();


export const safeImageUrl = (value) => {
  if (typeof value !== 'string') return '';
  const u = value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim().replace(/\\/g, '/');
  if (!u) return '';
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith('//')) return '';
  const parts = u.split('/').filter(Boolean);
  const at = parts.map((s) => s.toLowerCase()).lastIndexOf('uploads');
  const rest = at >= 0 ? parts.slice(at + 1) : parts.filter((s) => s !== '.');
  if (!rest.length || rest.some((s) => s === '.' || s === '..')) return '';
  if (/^(null|undefined)$/i.test(rest[rest.length - 1])) return '';
  return `${API_ORIGIN}/uploads/${rest.map(encodeURIComponent).join('/')}`;
};

export const kindOfCategory = (name = '') => {
  const k = String(name).toLowerCase();
  if (k.includes('laptop') || k.includes('notebook') || k.includes('computer')) return 'laptop';
  if (k.includes('phone') || k.includes('mobile')) return 'phone';
  if (k.includes('tablet') || k.includes('ipad')) return 'tablet';
  if (k.includes('audio') || k.includes('headphone') || k.includes('earbud')) return 'audio';
  if (k.includes('watch') || k.includes('wear')) return 'watch';
  if (k.includes('monitor') || k.includes('screen') || k.includes('tv') || k.includes('display')) return 'monitor';
  return 'box';
};



let swalPromise;
export const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((mod) => mod.default || mod);
  return swalPromise;
};

export const PAGE_SIZES = [12, 24, 48];
export const CONDITIONS = ['New', 'Refurbished', 'Used'];



export const LISTING_CSS = `
  @keyframes lkFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes lkWave { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .lk-float { animation: lkFloat 6s ease-in-out infinite; }
  .lk-float-slow { animation: lkFloat 9s ease-in-out infinite; }
  .lk-wave { animation: lkWave 14s linear infinite; }
  .lk-wave-rev { animation: lkWave 22s linear infinite reverse; }
  .hide-scrollbar { scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .lk-cv { content-visibility: auto; contain-intrinsic-size: auto 640px; }
  .lk-range { -webkit-appearance: none; appearance: none; background: transparent; pointer-events: none; position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; }
  .lk-range::-webkit-slider-thumb { -webkit-appearance: none; pointer-events: auto; width: 18px; height: 18px; border-radius: 9999px; background: #fff; border: 2px solid #10b981; box-shadow: 0 2px 0 0 #047857; cursor: grab; }
  .lk-range::-moz-range-thumb { pointer-events: auto; width: 14px; height: 14px; border-radius: 9999px; background: #fff; border: 2px solid #10b981; box-shadow: 0 2px 0 0 #047857; cursor: grab; }
  .lk-range:focus-visible::-webkit-slider-thumb { outline: 2px solid #34d399; outline-offset: 2px; }
  .swal2-container, .swal2-popup { font-family: var(--app-font, inherit); }
  @media (prefers-reduced-motion: reduce) { .lk-float, .lk-float-slow, .lk-wave, .lk-wave-rev { animation: none !important; } }
`;



const CAIRO_HREF = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap';
const CAIRO_STACK = "'Cairo', ui-sans-serif, system-ui, sans-serif";



export const useLangFont = (language) => {
  const isAr = language === 'ar';
  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    if (!isAr) { root.style.removeProperty('--app-font'); return undefined; }
    root.style.setProperty('--app-font', CAIRO_STACK);
    if (!document.getElementById('font-cairo')) {
      const link = document.createElement('link');
      link.id = 'font-cairo'; link.rel = 'stylesheet'; link.href = CAIRO_HREF;
      document.head.appendChild(link);
    }
    return () => root.style.removeProperty('--app-font');
  }, [isAr, language]);
  return useMemo(
    () => ({ className: isAr ? 'font-cairo' : 'font-poppins', style: isAr ? { fontFamily: CAIRO_STACK } : undefined }),
    [isAr]
  );
};

export const useBackToTop = (threshold = 700) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setShow(window.scrollY > threshold)); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [threshold]);
  return show;
};



export const useModalLock = (active, onClose) => {
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [active, onClose]);
};



export const useHScroll = (dep, isRTL = false) => {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ l: false, r: false });
  const scroll = useCallback(
    (dir) => ref.current?.scrollBy({ left: (dir === 'back' ? -1 : 1) * (isRTL ? -1 : 1) * 300, behavior: 'smooth' }),
    [isRTL]
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = Math.abs(el.scrollLeft);
        const l = x > 2, r = x + el.clientWidth < el.scrollWidth - 5;
        setEdge((p) => (p.l === l && p.r === r ? p : { l, r }));
      });
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); cancelAnimationFrame(raf); };
  }, [dep]);
  return { ref, edge, scroll };
};




export const Dropdown = memo(({ value, options, onChange, label, darkMode, className = '' }) => {
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
      if (!open) { openMenu(); return; }
      setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % options.length : (i - 1 + options.length) % options.length));
    } else if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault();
      pick(options[active]);
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
          className={`absolute end-0 z-30 mt-2 max-h-64 w-full min-w-[11rem] overflow-auto rounded-xl border p-1 shadow-xl ${
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




export const PriceRangeSlider = memo(({ range, max, step, onChange, darkMode }) => {
  const [lo, hi] = range;
  const pill = `rounded-lg px-2.5 py-1 text-xs font-bold tabular-nums ${darkMode ? 'bg-emerald-400/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`;
  return (
    <div className="space-y-4 pb-1" dir="ltr">
      <div className="flex flex-wrap justify-between gap-2">
        <span className={pill}>EGP {lo.toLocaleString()}</span>
        <span className={pill}>EGP {hi.toLocaleString()}</span>
      </div>
      <div className="relative h-5">
        <div className={`absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-500" style={{ left: `${(lo / max) * 100}%`, right: `${100 - (hi / max) * 100}%` }} />
        <input type="range" aria-label="Minimum price" className="lk-range" min={0} max={max} step={step} value={lo} style={{ zIndex: lo > max / 2 ? 5 : 3 }}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])} />
        <input type="range" aria-label="Maximum price" className="lk-range" min={0} max={max} step={step} value={hi} style={{ zIndex: 4 }}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])} />
      </div>
    </div>
  );
});




export const PaginationFilter = memo(({ darkMode, t, isOpen, onToggle, page, totalPages, pageSize, sizes = PAGE_SIZES, onPage, onSize, total }) => {
  const muted = darkMode ? 'text-gray-400' : 'text-gray-500';
  const strong = darkMode ? 'text-white' : 'text-gray-900';
  return (
    <FilterSection title={t('pagination', 'Pagination')} isOpen={isOpen} onToggle={onToggle} darkMode={darkMode}>
      <div className="space-y-4">
        <div>
          <p className={`mb-2 text-xs font-semibold ${muted}`}>{t('itemsPerPage', 'Items per page')}</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('itemsPerPage', 'Items per page')}>
            {sizes.map((n) => {
              const on = n === pageSize;
              return (
                <button key={n} type="button" onClick={() => onSize(n)} aria-pressed={on}
                  className={`min-w-[3rem] rounded-full border px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
                    on ? 'border-emerald-500 bg-emerald-500 text-white'
                      : darkMode ? 'border-gray-700 bg-gray-800 text-gray-300 hover:border-emerald-400 hover:text-emerald-400'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-emerald-500 hover:text-emerald-700'}`}>
                  <span dir="ltr">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {totalPages > 1 && (
          <div>
            <p className={`mb-2 text-xs ${muted}`}>
              {t('page', 'Page')} <b className={strong} dir="ltr">{page} / {totalPages}</b>
              <span className="mx-1.5" aria-hidden="true">–</span>
              <span dir="ltr">{total}</span> {t('items', 'items')}
            </p>
            <nav aria-label={t('pagination', 'Pagination')} className="flex flex-wrap gap-1.5">
              <PageBtn darkMode={darkMode} aria-label="Previous page" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </PageBtn>
              {getPaginationRange(page, totalPages).map((pg, i) =>
                pg === '…'
                  ? <span key={`d${i}`} className={`flex w-6 items-center justify-center text-sm ${muted}`}>…</span>
                  : <PageBtn key={pg} darkMode={darkMode} active={page === pg} onClick={() => onPage(pg)}><span dir="ltr">{pg}</span></PageBtn>
              )}
              <PageBtn darkMode={darkMode} aria-label="Next page" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </PageBtn>
            </nav>
          </div>
        )}
      </div>
    </FilterSection>
  );
});

export const FilterChip = memo(({ label, onRemove, darkMode }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${darkMode ? 'bg-emerald-400/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
    {label}
    <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}><FiX className="h-3 w-3" /></button>
  </span>
));




const WAVE = 'M0 60c120-40 240-40 360 0s240 40 360 0 240-40 360 0 240 40 360 0V120H0z';




export const HeroWave = memo(({ fill }) => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden sm:h-20">
    <svg className="lk-wave-rev absolute bottom-0 left-0 h-full w-[200%] opacity-40" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d={WAVE} fill={fill} /></svg>
    <svg className="lk-wave absolute bottom-0 left-0 h-3/4 w-[200%]" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d={WAVE} fill={fill} /></svg>
  </div>
));


const WAVE_FILL = { dark: '#111827', light: '#ffffff' };



export const WavyHeader = memo(({ darkMode, children, className = '' }) => (
  <header
    className={`relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br px-5 pb-20 pt-6 sm:mb-8 sm:px-8 sm:pb-24 sm:pt-8 [contain:paint] ${
      darkMode ? 'from-emerald-900 via-emerald-800 to-gray-900' : 'from-emerald-500 via-emerald-600 to-emerald-700'} ${className}`}
  >
   
   
    <div aria-hidden="true" className="pointer-events-none absolute -end-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 start-10 h-40 w-40 rounded-full bg-black/10" />

    <div className="relative z-10">{children}</div>

    <HeroWave fill={darkMode ? WAVE_FILL.dark : WAVE_FILL.light} />
  </header>
));

export const WaveHeader = WavyHeader; 




export const FloatingGlyphs = memo(({ items }) => (
  <>
    {items.map(([kind, pos, anim, delay]) => (
      <div key={`${kind}${pos}`} aria-hidden="true" style={{ animationDelay: delay }} className={`pointer-events-none absolute opacity-90 ${anim} ${pos}`}>
        <Glyph3D kind={kind} className="h-full w-full" />
      </div>
    ))}
  </>
));




export const StorefrontIllustration = memo(({ className = '' }) => {
  const uid = useId().replace(/:/g, '');
  const g = (n) => `${uid}${n}`;
  const stripes = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg viewBox="0 0 420 320" className={className} role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id={g('wall')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#e2e8f0" /></linearGradient>
        <linearGradient id={g('side')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cbd5e1" /><stop offset="1" stopColor="#94a3b8" /></linearGradient>
        <linearGradient id={g('glass')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e0f2fe" /><stop offset="1" stopColor="#38bdf8" stopOpacity=".6" /></linearGradient>
        <linearGradient id={g('door')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#047857" /></linearGradient>
        <linearGradient id={g('sign')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#047857" /><stop offset="1" stopColor="#064e3b" /></linearGradient>
        <linearGradient id={g('bagA')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
        <linearGradient id={g('bagB')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6ee7b7" /><stop offset="1" stopColor="#059669" /></linearGradient>
      </defs>

    
    
      <ellipse cx="205" cy="292" rx="185" ry="15" fill="#022c22" opacity=".28" />
      <polygon points="36,268 300,268 376,240 112,240" fill="#a7f3d0" opacity=".35" />
      <rect x="36" y="268" width="264" height="10" rx="3" fill="#065f46" opacity=".55" />

    
    
      <polygon points="70,104 120,84 340,84 290,104" fill="#f1f5f9" />
      <rect x="70" y="104" width="220" height="164" fill={`url(#${g('wall')})`} />
      <polygon points="290,104 340,84 340,240 290,268" fill={`url(#${g('side')})`} />
      <polygon points="302,150 326,140 326,176 302,186" fill={`url(#${g('glass')})`} stroke="#64748b" strokeWidth="2" />

     
     
      <rect x="150" y="86" width="5" height="12" fill="#475569" />
      <rect x="236" y="86" width="5" height="12" fill="#475569" />
      <rect x="130" y="58" width="140" height="36" rx="9" fill="#022c22" opacity=".35" />
      <rect x="125" y="52" width="140" height="36" rx="9" fill={`url(#${g('sign')})`} />
      <rect x="183" y="66" width="24" height="18" rx="3" fill="#fff" />
      <path d="M188 66v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="150" cy="70" r="3" fill="#fff" opacity=".6" /><circle cx="240" cy="70" r="3" fill="#fff" opacity=".6" />

     
     
      <polygon points="60,118 300,118 318,106 78,106" fill="#fde68a" />
      <rect x="70" y="146" width="220" height="16" rx="8" fill="#0f172a" opacity=".12" />
      {stripes.map((i) => (
        <path key={i} d={`M${60 + i * 30} 118h30v26a15 15 0 0 1-30 0z`} fill={i % 2 ? '#f59e0b' : '#ffffff'} />
      ))}

  
  
      <rect x="82" y="176" width="82" height="70" rx="8" fill={`url(#${g('glass')})`} stroke="#64748b" strokeWidth="3" />
      <rect x="96" y="212" width="38" height="10" rx="2" fill="#334155" />
      <rect x="100" y="190" width="30" height="22" rx="2" fill="#0f172a" /><rect x="103" y="193" width="24" height="16" rx="1" fill="#34d399" opacity=".85" />
      <rect x="142" y="196" width="14" height="26" rx="3" fill="#0f172a" /><rect x="144" y="199" width="10" height="18" rx="1.5" fill="#fbbf24" opacity=".9" />
      <line x1="88" y1="224" x2="158" y2="224" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      <polygon points="90,178 110,178 88,208 88,198" fill="#fff" opacity=".28" />

      <rect x="238" y="176" width="46" height="70" rx="8" fill={`url(#${g('glass')})`} stroke="#64748b" strokeWidth="3" />
      <rect x="248" y="196" width="26" height="32" rx="3" fill="#0f172a" /><rect x="251" y="199" width="20" height="26" rx="1.5" fill="#fcd34d" opacity=".85" />
      <line x1="242" y1="232" x2="280" y2="232" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />

    
    
      <rect x="176" y="176" width="50" height="92" rx="6" fill={`url(#${g('door')})`} />
      <rect x="184" y="184" width="34" height="46" rx="4" fill={`url(#${g('glass')})`} />
      <rect x="190" y="196" width="22" height="11" rx="3" fill="#fff" /><circle cx="196" cy="201.5" r="2.5" fill="#10b981" /><line x1="201" y1="201.5" x2="208" y2="201.5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <circle cx="217" cy="238" r="3.5" fill="#fef3c7" />
      <rect x="170" y="266" width="62" height="4" rx="2" fill="#94a3b8" />

     
     
      <polygon points="26,238 40,230 84,230 70,238" fill="#fde68a" />
      <polygon points="70,238 84,230 84,268 70,276" fill="#d97706" />
      <rect x="26" y="238" width="44" height="38" fill="#f59e0b" /><rect x="42" y="238" width="12" height="38" fill="#fff" opacity=".45" />
      <polygon points="32,214 44,207 76,207 64,214" fill="#6ee7b7" />
      <polygon points="64,214 76,207 76,231 64,238" fill="#059669" />
      <rect x="32" y="214" width="32" height="24" fill="#10b981" />

     
     
      <path d="M367 236v-6a10 10 0 0 1 20 0v6" fill="none" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="358" y="236" width="38" height="42" rx="5" fill={`url(#${g('bagA')})`} />
      <path d="M328 222v-8a13 13 0 0 1 26 0v8" fill="none" stroke="#065f46" strokeWidth="4" strokeLinecap="round" />
      <rect x="318" y="222" width="44" height="54" rx="6" fill={`url(#${g('bagB')})`} />
      <rect x="318" y="222" width="12" height="54" rx="6" fill="#fff" opacity=".18" />
      <circle cx="342" cy="250" r="7" fill="#fff" opacity=".9" /><circle cx="342" cy="250" r="3" fill="#10b981" />
    </svg>
  );
});