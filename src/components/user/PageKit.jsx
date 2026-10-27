import React, { memo } from 'react';
import { FiTag, FiChevronLeft, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { DeviceScene, Btn3D } from './Device3D';

/* Same gradient block as the Homepage / Products banners. You can import this in Homepage too. */
export const SectionBanner = memo(({ badge, title, subtitle, children, darkMode }) => (
  <div className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${darkMode ? 'bg-gradient-to-br from-emerald-900 via-emerald-950 to-gray-950 ring-1 ring-emerald-500/20' : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-800'}`}>
    <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
    <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />
    <div className="relative flex flex-wrap items-center justify-between gap-6">
      <div className="max-w-md">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white"><FiTag className="h-3 w-3" /> {badge}</span>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-emerald-50/80">{subtitle}</p>}
        {children}
      </div>
      <DeviceScene className="hidden h-32 w-48 sm:block lg:h-36 lg:w-56" />
    </div>
  </div>
));

export const EmptyState = memo(({ label, hint, darkMode }) => (
  <div className={`flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed py-12 text-center ${darkMode ? 'border-gray-800 bg-gray-900/40' : 'border-emerald-200 bg-white/60'}`}>
    <DeviceScene compact className="h-24 w-32" />
    <p className={`text-sm font-semibold sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{label}</p>
    {hint && <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{hint}</p>}
  </div>
));

export const ErrorState = memo(({ label, onRetry, retryLabel = 'Try again', darkMode }) => (
  <div role="alert" className={`flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed py-12 text-center ${darkMode ? 'border-red-900/60 bg-gray-900/40' : 'border-red-200 bg-white/60'}`}>
    <p className={`px-4 text-sm font-semibold sm:text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</p>
    {onRetry && (
      <Btn3D tone="soft" darkMode={darkMode} onClick={onRetry} className="px-5 py-2.5 text-sm">
        <FiRefreshCw className="h-4 w-4" /> {retryLabel}
      </Btn3D>
    )}
  </div>
));

export const LoadingGrid = memo(({ count = 6, className, itemClassName, darkMode }) => (
  <div className={className} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`animate-pulse rounded-3xl ${itemClassName} ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`} />
    ))}
  </div>
));

const pageItems = (page, total) => {
  const items = [];
  for (let p = 1; p <= total; p += 1) {
    if (p === 1 || p === total || Math.abs(p - page) <= 1) items.push(p);
    else if (items[items.length - 1] !== 'gap') items.push('gap');
  }
  return items;
};

export const Pager = memo(({ page, totalPages, onChange, darkMode, pending }) => {
  if (totalPages <= 1) return null;
  const idle = darkMode ? 'border-emerald-900/70 bg-gray-900/40 text-gray-300 hover:border-emerald-500' : 'border-emerald-100 bg-white text-gray-700 hover:border-emerald-400';
  return (
    <nav aria-label="Pagination" aria-busy={pending} className={`mt-8 flex flex-wrap items-center justify-center gap-2 transition-opacity ${pending ? 'opacity-70' : ''}`}>
      <Btn3D tone="soft" darkMode={darkMode} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page" className="h-10 w-10">
        <FiChevronLeft className="h-5 w-5 rtl:rotate-180" />
      </Btn3D>
      {pageItems(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`g${i}`} className={darkMode ? 'px-1 text-gray-600' : 'px-1 text-gray-400'}>…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={`h-10 w-10 rounded-xl border-2 text-sm font-bold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${
              p === page ? 'border-transparent bg-emerald-500 text-white shadow-[0_3px_0_0_#047857]' : idle
            }`}
          >
            {p}
          </button>
        )
      )}
      <Btn3D tone="soft" darkMode={darkMode} onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page" className="h-10 w-10">
        <FiChevronRight className="h-5 w-5 rtl:rotate-180" />
      </Btn3D>
    </nav>
  );
});