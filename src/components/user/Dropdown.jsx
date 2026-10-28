import React, { useState, useEffect, useRef, useCallback, useMemo, useId, memo } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck, FiImage } from 'react-icons/fi';
import { resolveImageSrc } from '../../common/utils/productutils';

const OPEN_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

const DropdownOption = memo(({ id, index, label, selected, active, onHover, onPick }) => (
  <li
    id={id}
    role="option"
    aria-selected={selected}
    onMouseEnter={() => onHover(index)}
    onMouseDown={(e) => e.preventDefault()}
    onClick={() => onPick(index)}
    className={`flex items-center justify-between gap-2 px-3 py-2.5 text-xs font-bold cursor-pointer transition-colors ${
      active ? 'bg-gray-100 dark:bg-gray-700/70' : ''} ${selected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'}`}
  >
    <span className="truncate">{label}</span>
    {selected && <FiCheck size={13} className="flex-shrink-0" />}
  </li>
));

export const Dropdown = memo(({
  value, options, onChange, placeholder = 'اختر', id, disabled = false, invalid = false, className = '', ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [active, setActive] = useState(-1);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const uid = useId();

  const selectedIdx = useMemo(
    () => options.findIndex((o) => String(o.value) === String(value)),
    [options, value],
  );
  const selected = options[selectedIdx];

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const need = Math.min(240, options.length * 40 + 8);
    const below = window.innerHeight - r.bottom;
    const up = below < need + 8 && r.top > below;
    setPos({
      left: r.left,
      width: r.width,
      top: up ? undefined : r.bottom + 6,
      bottom: up ? window.innerHeight - r.top + 6 : undefined,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return undefined;
    place();
    setActive(selectedIdx >= 0 ? selectedIdx : 0);
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      close();
    };
    const onScroll = (e) => { if (!listRef.current?.contains(e.target)) close(); };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open, place, close, selectedIdx]);

  useEffect(() => {
    if (open && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const pick = useCallback((i) => {
    const o = options[i];
    if (!o) return;
    onChange(o.value);
    setOpen(false);
    btnRef.current?.focus();
  }, [options, onChange]);

  const onKeyDown = useCallback((e) => {
    if (disabled) return;
    const last = options.length - 1;
    if (!open) {
      if (OPEN_KEYS.includes(e.key)) { e.preventDefault(); setOpen(true); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive((i) => (i >= last ? 0 : i + 1)); break;
      case 'ArrowUp': e.preventDefault(); setActive((i) => (i <= 0 ? last : i - 1)); break;
      case 'Home': e.preventDefault(); setActive(0); break;
      case 'End': e.preventDefault(); setActive(last); break;
      case 'Enter': case ' ': e.preventDefault(); pick(active); break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); close(); break;
      case 'Tab': close(); break;
      default: break;
    }
  }, [disabled, options.length, open, active, pick, close]);

  return (
    <>
      <button
        ref={btnRef}
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? uid : undefined}
        aria-activedescendant={open && active >= 0 ? `${uid}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={`w-full h-10 px-3 inline-flex items-center justify-between gap-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border text-sm font-bold transition focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-50 disabled:pointer-events-none ${
          invalid ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'} ${selected ? 'text-gray-800 dark:text-white' : 'text-gray-400'} ${className}`}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <FiChevronDown size={14} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <ul
          ref={listRef}
          id={uid}
          role="listbox"
          dir="rtl"
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          className="z-[200] max-h-60 overflow-y-auto slim-scroll rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1"
        >
          {options.length === 0 && <li className="px-3 py-2.5 text-xs font-bold text-gray-400">لا توجد خيارات</li>}
          {options.map((o, i) => (
            <DropdownOption
              key={String(o.value)}
              id={`${uid}-${i}`}
              index={i}
              label={o.label}
              selected={i === selectedIdx}
              active={i === active}
              onHover={setActive}
              onPick={pick}
            />
          ))}
        </ul>,
        document.body,
      )}
    </>
  );
});

export const ProductImage = memo(({ raw, alt = '', className = 'w-11 h-11', iconSize = 18 }) => {
  const src = useMemo(() => resolveImageSrc(raw), [raw]);
  const [failedSrc, setFailedSrc] = useState(null);
  const onError = useCallback(() => setFailedSrc(src), [src]);
  const failed = failedSrc === src;

  return (
    <span className={`${className} rounded-lg bg-gray-100 dark:bg-gray-700/60 text-gray-400 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700`}>
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          onError={onError}
          className="w-full h-full object-cover"
        />
      ) : <FiImage size={iconSize} aria-hidden="true" />}
    </span>
  );
});