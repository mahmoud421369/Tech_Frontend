import React, { memo } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Glyph3D, PageBtn, getPaginationRange } from './Ui3D';
import { Dropdown, PAGE_SIZES, HeroWave } from './ListingKit';

const shell = (darkMode) => (darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white');


export const RowsPerPage = memo(({ value, onChange, darkMode, label = 'Rows per page', className = '' }) => {
  const options = PAGE_SIZES.map((n) => ({ value: n, label: String(n) }));
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`whitespace-nowrap text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
      <Dropdown label={label} value={value} onChange={(v) => onChange(Number(v))} options={options} darkMode={darkMode} className="w-24" />
    </div>
  );
});


export const Pager = memo(({ page, totalPages, onPage, darkMode, label = 'Pagination', className = '' }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={label} className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 ${className}`}>
      <PageBtn darkMode={darkMode} aria-label="Previous page" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>
        <FiChevronLeft className="h-4 w-4 rtl:rotate-180" />
      </PageBtn>
      {getPaginationRange(page, totalPages).map((pg, i) =>
        pg === '…'
          ? <span key={`d${i}`} className={`w-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>…</span>
          : <PageBtn key={pg} darkMode={darkMode} active={page === pg} onClick={() => onPage(pg)}><span dir="ltr">{pg}</span></PageBtn>
      )}
      <PageBtn darkMode={darkMode} aria-label="Next page" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <FiChevronRight className="h-4 w-4 rtl:rotate-180" />
      </PageBtn>
    </nav>
  );
});


export const ResultsFooter = memo(({ summary, page, totalPages, onPage, pageSize, onSize, darkMode }) => (
  <div className={`mt-6 flex flex-col items-center gap-3 rounded-2xl border p-3 sm:mt-10 sm:p-4 lg:flex-row lg:justify-between ${shell(darkMode)}`}>
    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} aria-live="polite">{summary}</p>
    <Pager page={page} totalPages={totalPages} onPage={onPage} darkMode={darkMode} />
    <RowsPerPage value={pageSize} onChange={onSize} darkMode={darkMode} />
  </div>
));


export const SectionToolbar = memo(({ title, subtitle, darkMode, children }) => (
  <div className={`mb-4 min-w-0 rounded-2xl border p-3 sm:p-4 ${shell(darkMode)}`}>
    {title && (
      <div className="mb-3 min-w-0">
        <h2 className={`text-lg font-extrabold tracking-tight sm:text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
        {subtitle && <p className={`mt-0.5 text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
));


const DEFAULT_KINDS = ['laptop', 'phone', 'monitor'];

/* `art` (any node, e.g. <IsoIllustration …/>) replaces the three floating 3D glyphs.
   Pages that don't pass `art` keep the old glyphs (`kinds`), so other pages are unaffected. */
export const FeaturedBanner = memo(({ darkMode, badge, title, subtitle, art, kinds = DEFAULT_KINDS, fill, children }) => (
  <section className={`lk-cv pb-10 sm:pb-14 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
    <div className={`relative overflow-hidden bg-gradient-to-br ${darkMode ? 'from-emerald-900 via-emerald-950 to-gray-950' : 'from-emerald-500 via-emerald-600 to-emerald-800'}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 start-[-4rem] h-64 w-64 rounded-full bg-black/10" />
      <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-10 sm:px-6 sm:pb-32 lg:px-8">
        <div className="relative z-10 max-w-md">
          {badge && <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white">{badge}</span>}
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-emerald-50/80">{subtitle}</p>}
        </div>
        {art ? (
          /* sits in the free space above the overlapping cards; no drop-shadow filter (repaints every animation frame) */
          <div aria-hidden="true" className="pointer-events-none absolute end-4 top-4 hidden h-36 w-36 sm:block lg:end-16 lg:h-44 lg:w-44">
            {art}
          </div>
        ) : (
          <div aria-hidden="true" className="pointer-events-none absolute bottom-16 end-4 hidden items-end gap-2 sm:flex lg:end-16">
            <Glyph3D kind={kinds[1]} className="lk-float h-16 w-16 drop-shadow-2xl lg:h-20 lg:w-20" />
            <Glyph3D kind={kinds[0]} className="lk-float-slow h-28 w-28 drop-shadow-2xl lg:h-36 lg:w-36" />
            <Glyph3D kind={kinds[2]} className="lk-float h-16 w-16 drop-shadow-2xl lg:h-20 lg:w-20" />
          </div>
        )}
      </div>
      <HeroWave fill={fill} />
    </div>
    <div className="relative z-10 mx-auto -mt-20 max-w-7xl px-4 sm:-mt-24 sm:px-6 lg:px-8">{children}</div>
  </section>
));