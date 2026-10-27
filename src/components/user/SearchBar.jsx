import React, { useRef, useEffect, useCallback, memo } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

/* Shared modern search field: light-gray, turns white with an emerald ring on focus.
   "/" focuses it from anywhere (outside inputs), Esc clears it, spinner shows while filtering is deferred. */
export const SearchBar = memo(({ value, onChange, placeholder, ariaLabel = 'Search', clearLabel = 'Clear search', pending = false, darkMode }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const clear = useCallback(() => { onChange(''); inputRef.current?.focus(); }, [onChange]);

  return (
    <div
      role="search"
      className={`group relative flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 ring-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/70 ${
        darkMode
          ? 'bg-gray-800 ring-gray-700 hover:bg-gray-800/80 focus-within:bg-gray-800'
          : 'bg-gray-100 ring-transparent hover:bg-gray-200/70 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-emerald-900/10'
      }`}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center" aria-hidden="true">
        {pending
          ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          : <FiSearch className={`h-[18px] w-[18px] transition-colors group-focus-within:text-emerald-500 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />}
      </span>
      <input
        ref={inputRef} type="search" value={value} maxLength={80}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape' && value) { e.preventDefault(); onChange(''); } }}
        placeholder={placeholder} aria-label={ariaLabel} autoComplete="off" spellCheck={false} enterKeyHint="search"
        className={`min-w-0 flex-1 bg-transparent cursor-pointer text-sm font-medium outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden ${darkMode ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-500'}`}
      />
      {value ? (
        <button
          type="button" onClick={clear} aria-label={clearLabel}
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
        >
          <FiX className="h-3.5 w-3.5" />
        </button>
      ) : (
        <kbd aria-hidden="true" ></kbd>
      )}
    </div>
  );
});

export default SearchBar;