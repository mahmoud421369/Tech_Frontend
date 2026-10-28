import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPlus, FiEdit3, FiUploadCloud, FiTrash2, FiAlertCircle, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useEscape, useShopLocale, tpl } from '../shop/TableKit';
import {
  CONDITIONS, CONDITION_LABELS, ALLOWED_IMAGE_TYPES, IMAGE_MAX_BYTES, PRICE_MAX, STOCK_MAX,
  resolveImageSrc, validateImageFile, validateProduct,
} from '../../common/utils/productutils';

const TRANSLATIONS = {
  ar: {
    titleAdd: 'إضافة منتج جديد',
    titleEdit: 'تعديل المنتج',
    close: 'إغلاق',
    image: 'صورة المنتج',
    imageHint: 'JPG أو PNG أو WEBP — حتى {mb} ميجابايت',
    imagePreviewAlt: 'معاينة الصورة',
    imageDrop: 'اسحب الصورة هنا أو اختر ملفاً',
    imageCurrent: 'الصورة الحالية — اختر صورة جديدة لاستبدالها',
    pickImage: 'اختيار صورة',
    removeImage: 'إزالة',
    name: 'اسم المنتج',
    description: 'الوصف',
    price: 'السعر (ج.م)',
    stock: 'الكمية في المخزون',
    upTo: 'حتى {n}',
    category: 'الفئة',
    categoryPlaceholder: 'اختر الفئة',
    condition: 'حالة المنتج',
    conditions: {},
    cancel: 'إلغاء',
    saving: 'جارٍ الحفظ…',
    save: 'حفظ التعديلات',
    add: 'إضافة المنتج',
  },
  en: {
    titleAdd: 'Add new product',
    titleEdit: 'Edit product',
    close: 'Close',
    image: 'Product image',
    imageHint: 'JPG, PNG or WEBP — up to {mb} MB',
    imagePreviewAlt: 'Image preview',
    imageDrop: 'Drag an image here or choose a file',
    imageCurrent: 'Current image — pick a new one to replace it',
    pickImage: 'Choose image',
    removeImage: 'Remove',
    name: 'Product name',
    description: 'Description',
    price: 'Price (EGP)',
    stock: 'Stock quantity',
    upTo: 'Up to {n}',
    category: 'Category',
    categoryPlaceholder: 'Select category',
    condition: 'Product condition',
    conditions: { NEW: 'New', USED: 'Used', REFURBISHED: 'Refurbished', OPEN_BOX: 'Open box' },
    cancel: 'Cancel',
    saving: 'Saving…',
    save: 'Save changes',
    add: 'Add product',
  },
};

const PM_CSS = `
.pm{--pm-card:#ffffff;--pm-ink:#04261a;--pm-muted:#4b6b5c;--pm-line:#04261a;--pm-shadow:#04261a;--pm-gray:#e8ebe9;--pm-dot:#04261a;--pm-accent:#10b981;--pm-btn:#059669;--pm-on:#ffffff}
.dark .pm{--pm-card:#2a2a2a;--pm-ink:#ffffff;--pm-muted:#a3a3a3;--pm-line:#000000;--pm-shadow:#000000;--pm-gray:#1e1e1e;--pm-dot:#3f3f3f;--pm-accent:#39ff88;--pm-btn:#39ff88;--pm-on:#022c22}
.pm[dir="rtl"] *,.pm [dir="rtl"] *{letter-spacing:0!important}
.pm-gray{background:var(--pm-gray)}
.pm-muted{color:var(--pm-muted)}
.pm-line{border-color:var(--pm-line)}
.pm-card{background:var(--pm-card);color:var(--pm-ink);border:2px solid var(--pm-line);box-shadow:3px 3px 0 var(--pm-shadow)}
.pm-ul{text-decoration:underline;text-decoration-color:var(--pm-accent);text-decoration-thickness:3px;text-underline-offset:4px;text-decoration-skip-ink:none}
.pm-tile{display:inline-flex;align-items:center;justify-content:center;flex:none;border:2px solid var(--pm-line);color:#04261a}
.pm-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;background:var(--pm-card);color:var(--pm-ink);border:2px solid var(--pm-line);box-shadow:2px 2px 0 var(--pm-shadow);font-weight:700;cursor:pointer;white-space:nowrap;transition:transform .12s ease,box-shadow .12s ease}
.pm-btn:hover:not(:disabled){transform:translate(-1px,-1px);box-shadow:3px 3px 0 var(--pm-shadow)}
.pm-btn:active:not(:disabled){transform:translate(1px,1px);box-shadow:0 0 0 var(--pm-shadow)}
.pm-btn:disabled{opacity:.45;cursor:not-allowed}
.pm-btn-a{background:var(--pm-btn);color:var(--pm-on)}
.pm-btn-danger{color:#dc2626}
.dark .pm-btn-danger{color:#fca5a5}
.pm-btn-danger:hover:not(:disabled){background:#ef4444;color:#fff}
.pm-btn:focus-visible{outline:3px solid var(--pm-accent);outline-offset:2px}
.pm-field{display:block;width:100%;background:var(--pm-card);color:var(--pm-ink);border:2px solid var(--pm-line);box-shadow:2px 2px 0 var(--pm-shadow)}
.pm-field:focus{outline:3px solid var(--pm-accent);outline-offset:2px}
.pm-field::placeholder{color:var(--pm-muted);opacity:.8}
.pm-drop{border:2px dashed var(--pm-line);background:var(--pm-gray);transition:background-color .12s ease}
.pm-drop-on{background:var(--pm-card)}
.pm-label{display:block;margin-bottom:6px;font-size:11px;font-weight:800;text-transform:uppercase;color:var(--pm-ink)}
.pm-scroll{scrollbar-width:thin;scrollbar-color:var(--pm-accent) transparent}
.pm-scroll::-webkit-scrollbar{width:6px;height:6px}
.pm-scroll::-webkit-scrollbar-track{background:transparent}
.pm-scroll::-webkit-scrollbar-thumb{background:var(--pm-accent);border:1px solid var(--pm-line)}
@keyframes pmFade{from{opacity:0}to{opacity:1}}
@keyframes pmIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pm-fade{animation:pmFade .2s ease-out both}
.pm-in{animation:pmIn .15s ease-out both}
@media (prefers-reduced-motion:reduce){.pm-btn,.pm-drop{transition:none}.pm-fade,.pm-in{animation:none}}
`;
const STYLE_EL = <style>{PM_CSS}</style>;

const TONES = { am: '#facc15', em: '#34d399' };

const money = (v) => v.replace(/[^\d.]/g, '').replace(/(\..*?)\./g, '$1').slice(0, 10);
const digits = (v) => v.replace(/\D/g, '').slice(0, 7);

const ACCEPT = ALLOWED_IMAGE_TYPES.join(',');
const MAX_MB = IMAGE_MAX_BYTES / 1024 / 1024;
const PRICE_PLACEHOLDER_N = PRICE_MAX.toLocaleString('en-US');
const STOCK_PLACEHOLDER_N = STOCK_MAX.toLocaleString('en-US');

const INPUT = 'pm-field h-10 px-3 text-sm font-semibold';
const NUM_INPUT = `${INPUT} text-right tabular-nums`;
const TEXTAREA = 'pm-field px-3 py-2 text-sm font-semibold resize-none';
const BTN_SMALL = 'pm-btn h-8 px-3 text-[11px] uppercase';
const BTN_SMALL_DANGER = `${BTN_SMALL} pm-btn-danger`;
const BTN_FOOT = 'pm-btn flex-1 h-10 text-xs uppercase';
const BTN_FOOT_PRIMARY = 'pm-btn pm-btn-a flex-1 h-10 text-xs uppercase';

const useLockScroll = () => {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
};

const Overlay = ({ onClose, dir, children }) => {
  useLockScroll();
  return (
    <div className="pm fixed inset-0 z-[1000] flex items-center justify-center p-4" dir={dir}>
      {STYLE_EL}
      <div className="pm-fade absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {children}
    </div>
  );
};

const Tile = memo(({ icon: Icon, tone = 'em', className = 'h-9 w-9', size = 16 }) => (
  <span className={`pm-tile ${className}`} style={{ background: TONES[tone] || TONES.em }}>
    <Icon size={size} aria-hidden="true" />
  </span>
));

const Field = ({ label, htmlFor, children }) => (
  <div>
    <label htmlFor={htmlFor} className="pm-label">{label}</label>
    {children}
  </div>
);

const MENU_MAX_H = 240;

const Dropdown = memo(({ id, value, options, placeholder, dir, onChange }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value]);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;
  const listId = `${id}-list`;

  const measure = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const want = Math.min(MENU_MAX_H, options.length * 40 + 8);
    const up = below < want && above > below;
    setPos({
      left: r.left,
      width: r.width,
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
      maxHeight: Math.max(96, Math.min(MENU_MAX_H, up ? above : below)),
    });
  }, [options.length]);

  const close = useCallback(() => setOpen(false), []);

  const openMenu = useCallback(() => {
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [selectedIndex]);

  const toggle = useCallback(() => {
    if (open) close();
    else openMenu();
  }, [open, close, openMenu]);

  const choose = useCallback((i) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
  }, [options, onChange]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    measure();
    const onScroll = (e) => { if (!menuRef.current?.contains(e.target)) measure(); };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (!open || active < 0) return;
    menuRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active, pos]);

  const onKeyDown = (e) => {
    const last = options.length - 1;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i >= last ? 0 : i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? last : i - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Tab') close();
  };

  return (
    <>
      <button
        ref={btnRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${id}-opt-${active}` : undefined}
        onClick={toggle}
        onKeyDown={onKeyDown}
        className={`${INPUT} !flex items-center justify-between gap-2 text-start`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? '' : 'pm-muted'}`}>
          {selected ? selected.label : placeholder || ''}
        </span>
        <FiChevronDown size={16} aria-hidden="true" className={`flex-shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && pos && createPortal(
        <div className="pm" dir={dir}>
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-labelledby={id}
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
            className="pm-card pm-scroll pm-in fixed z-[1100] overflow-y-auto py-1"
          >
            {options.length === 0 && <li className="pm-muted px-3 py-2 text-xs font-bold">—</li>}
            {options.map((o, i) => {
              const isSel = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSel}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-start text-xs font-bold uppercase ${
                    isSel ? 'bg-[var(--pm-btn)] text-[var(--pm-on)]' : i === active ? 'bg-[var(--pm-gray)]' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {isSel && <FiCheck size={14} aria-hidden="true" className="flex-shrink-0" />}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
});

const ImagePicker = memo(({ image, isEdit, T, onChange, onClearError }) => {
  const [imgError, setImgError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState('');
  const fileRef = useRef(null);

  const isFile = image instanceof File;

  useEffect(() => {
    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(resolveImageSrc(image));
    return undefined;
  }, [image]);

  const pickFile = useCallback(async (file) => {
    if (!file) return;
    const problem = await validateImageFile(file);
    onClearError();
    if (problem) { setImgError(problem); return; }
    setImgError('');
    onChange('image', file);
  }, [onChange, onClearError]);

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true); }, []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer?.files?.[0]);
  }, [pickFile]);
  const browse = useCallback(() => fileRef.current?.click(), []);
  const onFile = useCallback((e) => { pickFile(e.target.files?.[0]); e.target.value = ''; }, [pickFile]);
  const clear = useCallback(() => { onChange('image', null); setImgError(''); }, [onChange]);
  const previewFail = useCallback(() => setPreview(''), []);

  return (
    <div>
      <span className="pm-label">{T.image}</span>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`pm-drop flex items-center gap-3 p-3 ${dragging ? 'pm-drop-on' : ''} ${imgError ? '!border-red-500' : ''}`}
      >
        <span className="pm-card !shadow-none flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden">
          {preview
            ? <img src={preview} alt={T.imagePreviewAlt} className="h-full w-full object-cover" onError={previewFail} />
            : <FiUploadCloud size={24} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="pm-muted truncate text-[11px] font-bold">
            {isFile ? image.name : (isEdit && preview ? T.imageCurrent : T.imageDrop)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={browse} className={BTN_SMALL}>
              <FiUploadCloud size={12} aria-hidden="true" /> {T.pickImage}
            </button>
            {isFile && (
              <button type="button" onClick={clear} className={BTN_SMALL_DANGER}>
                <FiTrash2 size={12} aria-hidden="true" /> {T.removeImage}
              </button>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onFile} />
      </div>
      <p className="pm-muted mt-1.5 text-[10px] font-semibold">{tpl(T.imageHint, { mb: MAX_MB })}</p>
      {imgError && <p role="alert" className="mt-1 text-[11px] font-bold text-red-500">{imgError}</p>}
    </div>
  );
});

const ProductModal = ({ mode, data, categories, onChange, onSubmit, onClose, busy = false }) => {
  useEscape(onClose);
  const { language, dir, font } = useShopLocale();
  const T = TRANSLATIONS[language === 'ar' ? 'ar' : 'en'];

  const [error, setError] = useState('');

  const isEdit = mode === 'edit';
  const title = isEdit ? T.titleEdit : T.titleAdd;

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: String(c.name ?? '').slice(0, 60) })),
    [categories],
  );
  const conditionOptions = useMemo(
    () => CONDITIONS.map((c) => ({ value: c, label: T.conditions[c] || CONDITION_LABELS[c] || c })),
    [T],
  );

  const clearError = useCallback(() => setError(''), []);

  const handlers = useMemo(() => {
    const mk = (field, sanitize) => (e) => {
      setError('');
      onChange(field, sanitize ? sanitize(e.target.value) : e.target.value);
    };
    return {
      name: mk('name'),
      description: mk('description'),
      price: mk('price', money),
      stock: mk('stockQuantity', digits),
      category: (v) => { setError(''); onChange('categoryId', v); },
      condition: (v) => { setError(''); onChange('condition', v); },
    };
  }, [onChange]);

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    const problem = validateProduct(data, categories);
    if (problem) { setError(problem); return; }
    setError('');
    onSubmit();
  };

  return (
    <Overlay onClose={onClose} dir={dir}>
      <form
        onSubmit={submit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-label={title}
        dir={dir}
        lang={language}
        style={font}
        className="pm-card pm-in relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden text-start"
      >
        <div className="pm-gray pm-line flex flex-shrink-0 items-center justify-between border-b-2 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Tile icon={isEdit ? FiEdit3 : FiPlus} tone={isEdit ? 'am' : 'em'} className="h-9 w-9" size={16} />
            <h3 className="text-sm font-extrabold uppercase"><span className="pm-ul">{title}</span></h3>
          </div>
          <button type="button" onClick={onClose} aria-label={T.close} className="pm-btn h-8 w-8">
            <FiX size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="pm-scroll space-y-4 overflow-y-auto px-5 py-4">
          <ImagePicker
            image={data.image}
            isEdit={isEdit}
            T={T}
            onChange={onChange}
            onClearError={clearError}
          />

          <Field label={T.name} htmlFor="p-name">
            <input id="p-name" type="text" maxLength={120} autoComplete="off" value={data.name} onChange={handlers.name} className={INPUT} />
          </Field>

          <Field label={T.description} htmlFor="p-desc">
            <textarea id="p-desc" rows={3} maxLength={2000} value={data.description} onChange={handlers.description} className={TEXTAREA} />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={T.price} htmlFor="p-price">
              <input
                id="p-price" type="text" inputMode="decimal" dir="ltr" autoComplete="off"
                value={data.price} onChange={handlers.price}
                placeholder={tpl(T.upTo, { n: PRICE_PLACEHOLDER_N })}
                className={NUM_INPUT}
              />
            </Field>
            <Field label={T.stock} htmlFor="p-stock">
              <input
                id="p-stock" type="text" inputMode="numeric" dir="ltr" autoComplete="off"
                value={data.stockQuantity} onChange={handlers.stock}
                placeholder={tpl(T.upTo, { n: STOCK_PLACEHOLDER_N })}
                className={NUM_INPUT}
              />
            </Field>
            <Field label={T.category} htmlFor="p-cat">
              <Dropdown
                id="p-cat"
                dir={dir}
                value={data.categoryId ? String(data.categoryId) : ''}
                options={categoryOptions}
                placeholder={T.categoryPlaceholder}
                onChange={handlers.category}
              />
            </Field>
            <Field label={T.condition} htmlFor="p-cond">
              <Dropdown
                id="p-cond"
                dir={dir}
                value={data.condition || CONDITIONS[0]}
                options={conditionOptions}
                onChange={handlers.condition}
              />
            </Field>
          </div>

          {error && (
            <p role="alert" className="pm-card !shadow-none !border-red-500 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-red-600 dark:text-red-300">
              <FiAlertCircle size={13} className="flex-shrink-0" aria-hidden="true" /> {error}
            </p>
          )}
        </div>

        <div className="pm-gray pm-line flex flex-shrink-0 gap-2.5 border-t-2 px-5 py-4">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_FOOT}>{T.cancel}</button>
          <button type="submit" disabled={busy} className={BTN_FOOT_PRIMARY}>
            {busy ? T.saving : isEdit ? T.save : T.add}
          </button>
        </div>
      </form>
    </Overlay>
  );
};

export default memo(ProductModal);