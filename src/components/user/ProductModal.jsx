import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiPlus, FiEdit3, FiUploadCloud, FiTrash2, FiAlertCircle, FiChevronDown, FiCheck, FiZap, FiRotateCcw, FiLoader } from 'react-icons/fi';
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
    removeBg: 'إزالة الخلفية وتحسين الجودة',
    restoreOriginal: 'استعادة الأصلية',
    cancelProcessing: 'إيقاف المعالجة',
    bgHint: 'تتم المعالجة على جهازك دون رفع الصورة — في أول مرة يتم تحميل النموذج مرة واحدة ثم يُحفظ في المتصفح',
    bgDone: 'تمت إزالة الخلفية وتحسين الصورة',
    bgError: 'تعذرت معالجة الصورة. حاول مرة أخرى أو استخدم الصورة الأصلية',
    bgTooLarge: 'حجم الصورة بعد المعالجة أكبر من {mb} ميجابايت',
    stages: {
      prep: 'تجهيز الصورة…',
      download: 'تحميل نموذج إزالة الخلفية (مرة واحدة فقط)…',
      remove: 'إزالة الخلفية…',
      enhance: 'تحسين الجودة…',
    },
    name: 'اسم المنتج',
    description: 'الوصف',
    price: 'السعر (ج.م)',
    stock: 'الكمية في المخزون',
    upTo: 'حتى {n}',
    category: 'الفئة',
    categoryPlaceholder: 'اختر الفئة',
    condition: 'حالة المنتج',
    conditions: {},
    optional: 'اختياري',
    specifications: 'المواصفات',
    specificationsHint: 'افصل بين كل مواصفة وأخرى بفاصلة — تظهر كل مواصفة في سطر مستقل',
    specificationsPlaceholder: 'شاشة 6.1 بوصة, رام 8 جيجا, تخزين 256 جيجا',
    specCount: '{n} / {max} مواصفة',
    discount: 'الخصم',
    discountTypes: { PERCENTAGE: 'نسبة مئوية (%)', FIXED_AMOUNT: 'مبلغ ثابت (ج.م)' },
    discountPlaceholders: { PERCENTAGE: 'من 0 إلى 99.99', FIXED_AMOUNT: '0.00' },
    discountValueLabel: 'قيمة الخصم',
    finalPrice: 'السعر بعد الخصم',
    currency: 'ج.م',
    errSpecsCount: 'عدد المواصفات كبير (الحد الأقصى {n})',
    errSpecLen: 'يجب ألا تتجاوز كل مواصفة {n} حرفاً',
    errPercent: 'نسبة الخصم يجب أن تكون أقل من 100',
    errFixed: 'مبلغ الخصم يجب أن يكون أقل من سعر المنتج',
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
    removeBg: 'Remove background & enhance',
    restoreOriginal: 'Restore original',
    cancelProcessing: 'Stop processing',
    bgHint: 'Processed on your device, the image is not uploaded — the model downloads once, then stays cached in your browser',
    bgDone: 'Background removed and image enhanced',
    bgError: 'Could not process the image. Try again or keep the original',
    bgTooLarge: 'Processed image is larger than {mb} MB',
    stages: {
      prep: 'Preparing image…',
      download: 'Downloading background model (one time only)…',
      remove: 'Removing background…',
      enhance: 'Enhancing quality…',
    },
    name: 'Product name',
    description: 'Description',
    price: 'Price (EGP)',
    stock: 'Stock quantity',
    upTo: 'Up to {n}',
    category: 'Category',
    categoryPlaceholder: 'Select category',
    condition: 'Product condition',
    conditions: { NEW: 'New', USED: 'Used', REFURBISHED: 'Refurbished', OPEN_BOX: 'Open box' },
    optional: 'Optional',
    specifications: 'Specifications',
    specificationsHint: 'Separate each specification with a comma — each one is shown on its own line',
    specificationsPlaceholder: 'Screen 6.1 inch, 8GB RAM, 256GB storage',
    specCount: '{n} / {max} specifications',
    discount: 'Discount',
    discountTypes: { PERCENTAGE: 'Percentage (%)', FIXED_AMOUNT: 'Fixed amount (EGP)' },
    discountPlaceholders: { PERCENTAGE: '0 to 99.99', FIXED_AMOUNT: '0.00' },
    discountValueLabel: 'Discount value',
    finalPrice: 'Final price after discount',
    currency: 'EGP',
    errSpecsCount: 'Too many specifications (max {n})',
    errSpecLen: 'Each specification must be at most {n} characters',
    errPercent: 'Percentage discount must be less than 100',
    errFixed: 'Fixed discount must be less than the product price',
    cancel: 'Cancel',
    saving: 'Saving…',
    save: 'Save changes',
    add: 'Add product',
  },
};

const PM_CSS = `
.pm{--pm-card:#ffffff;--pm-ink:#04261a;--pm-muted:#4b6b5c;--pm-line:#04261a;--pm-shadow:#04261a;--pm-gray:#e8ebe9;--pm-dot:#04261a;--pm-accent:#10b981;--pm-btn:#059669;--pm-on:#ffffff;--pm-check-a:#ffffff;--pm-check-b:#d9dedb}
.dark .pm{--pm-card:#2a2a2a;--pm-ink:#ffffff;--pm-muted:#a3a3a3;--pm-line:#000000;--pm-shadow:#000000;--pm-gray:#1e1e1e;--pm-dot:#3f3f3f;--pm-accent:#39ff88;--pm-btn:#39ff88;--pm-on:#022c22;--pm-check-a:#3a3a3a;--pm-check-b:#2a2a2a}
.pm[dir="rtl"] *,.pm [dir="rtl"] *{letter-spacing:0!important}
.pm-gray{background:var(--pm-gray)}
.pm-muted{color:var(--pm-muted)}
.pm-line{border-color:var(--pm-line)}
.pm-card{background:var(--pm-card);color:var(--pm-ink);border:2px solid var(--pm-line);box-shadow:3px 3px 0 var(--pm-shadow)}
.pm-checker{background-color:var(--pm-check-a);background-image:conic-gradient(var(--pm-check-b) 25%,transparent 0 50%,var(--pm-check-b) 0 75%,transparent 0);background-size:12px 12px}
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
.pm-bar{height:8px;border:2px solid var(--pm-line);background:var(--pm-card);overflow:hidden;position:relative}
.pm-bar>span{display:block;height:100%;background:var(--pm-accent);transition:width .2s ease}
.pm-bar-wait>span{position:absolute;inset-block:0;width:35%;animation:pmSlide 1.1s ease-in-out infinite alternate;transition:none}
@keyframes pmSlide{from{inset-inline-start:0}to{inset-inline-start:65%}}
.pm-scroll{scrollbar-width:thin;scrollbar-color:var(--pm-accent) transparent}
.pm-scroll::-webkit-scrollbar{width:6px;height:6px}
.pm-scroll::-webkit-scrollbar-track{background:transparent}
.pm-scroll::-webkit-scrollbar-thumb{background:var(--pm-accent);border:1px solid var(--pm-line)}
@keyframes pmFade{from{opacity:0}to{opacity:1}}
@keyframes pmIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pm-fade{animation:pmFade .2s ease-out both}
.pm-in{animation:pmIn .15s ease-out both}
@media (prefers-reduced-motion:reduce){.pm-btn,.pm-drop,.pm-bar>span{transition:none}.pm-fade,.pm-in,.pm-bar-wait>span{animation:none}}
`;
const STYLE_EL = <style>{PM_CSS}</style>;

const TONES = { am: '#facc15', em: '#34d399' };

const money = (v) => v.replace(/[^\d.]/g, '').replace(/(\..*?)\./g, '$1').slice(0, 10);
const digits = (v) => v.replace(/\D/g, '').slice(0, 7);
const discountMoney = (v) =>
  v.replace(/[^\d.]/g, '').replace(/(\..*?)\./g, '$1').replace(/^(\d*\.\d{0,2}).*$/, '$1').slice(0, 11);
const specsText = (v) => v.replace(/،/g, ',');

const asText = (v) => (Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v));
const asDiscountText = (v) => (parseFloat(v) > 0 ? String(v) : '');

const SPEC_MAX_LINES = 50;
const SPEC_MAX_LEN = 200;
const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'];
const DEFAULT_DISCOUNT_TYPE = DISCOUNT_TYPES[0];

const parseSpecs = (raw) => {
  const text = asText(raw);
  if (!text) return [];
  const seen = new Set();
  const out = [];
  for (const part of text.split(',')) {
    const s = part.trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
};

const computeFinalPrice = (priceRaw, type, valueRaw) => {
  const price = parseFloat(priceRaw);
  const value = parseFloat(valueRaw);
  if (!(price > 0) || !(value > 0)) return null;
  if (type === 'PERCENTAGE') return value < 100 ? price - (price * value) / 100 : null;
  return value < price ? price - value : null;
};

const validateExtras = (data, T) => {
  const specs = parseSpecs(data.specifications);
  if (specs.length > SPEC_MAX_LINES) return tpl(T.errSpecsCount, { n: SPEC_MAX_LINES });
  if (specs.some((s) => s.length > SPEC_MAX_LEN)) return tpl(T.errSpecLen, { n: SPEC_MAX_LEN });
  const value = parseFloat(data.discountValue);
  if (value > 0) {
    const type = data.discountType || DEFAULT_DISCOUNT_TYPE;
    if (type === 'PERCENTAGE' && value >= 100) return T.errPercent;
    if (type === 'FIXED_AMOUNT' && value >= parseFloat(data.price)) return T.errFixed;
  }
  return '';
};

const ACCEPT = ALLOWED_IMAGE_TYPES.join(',');
const MAX_MB = IMAGE_MAX_BYTES / 1024 / 1024;
const PRICE_PLACEHOLDER_N = PRICE_MAX.toLocaleString('en-US');
const STOCK_PLACEHOLDER_N = STOCK_MAX.toLocaleString('en-US');

const BG_INPUT_MAX = 1024;
const BG_OUTPUT_MAX = 1280;
const BG_ALPHA_CUTOFF = 8;
const BG_PAD_RATIO = 0.04;
const BG_SHARPEN = 0.35;
const BG_QUALITIES = [0.9, 0.75, 0.6];

const bgDevice = () => (typeof navigator !== 'undefined' && navigator.gpu ? 'gpu' : 'cpu');

const bgConfig = (device) => ({
  device,
  model: device === 'gpu' ? 'isnet_fp16' : 'isnet_quint8',
  output: { format: 'image/png', quality: 1 },
});

let bgLibPromise = null;
const bgPreloaded = {};

const loadBgLib = () => {
  if (!bgLibPromise) {
    bgLibPromise = import('@imgly/background-removal').catch((err) => {
      bgLibPromise = null;
      throw err;
    });
  }
  return bgLibPromise;
};

const preloadBgModel = () => {
  const device = bgDevice();
  if (bgPreloaded[device]) return;
  bgPreloaded[device] = true;
  loadBgLib()
    .then((lib) => (typeof lib.preload === 'function' ? lib.preload(bgConfig(device)) : undefined))
    .catch(() => { bgPreloaded[device] = false; });
};

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

const fitSize = (w, h, max) => {
  const scale = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
};

const downscaleInput = async (file) => {
  const probe = await createImageBitmap(file);
  const { w, h } = fitSize(probe.width, probe.height, BG_INPUT_MAX);
  if (w === probe.width && h === probe.height && file.size < 1.5 * 1024 * 1024) {
    probe.close?.();
    return file;
  }
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(probe, 0, 0, w, h);
  probe.close?.();
  return (await canvasToBlob(canvas, 'image/jpeg', 0.95)) || file;
};

const alphaBounds = (data, w, h) => {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    const row = y * w * 4;
    for (let x = 0; x < w; x += 1) {
      if (data[row + x * 4 + 3] > BG_ALPHA_CUTOFF) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w, h };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
};

const sharpen = (imageData, amount) => {
  const { data, width: w, height: h } = imageData;
  const src = new Uint8ClampedArray(data);
  const stride = w * 4;
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * stride + x * 4;
      if (src[i + 3] < 250) continue;
      for (let c = 0; c < 3; c += 1) {
        const k = i + c;
        const around = src[k - 4] + src[k + 4] + src[k - stride] + src[k + stride];
        data[k] = src[k] + amount * (4 * src[k] - around);
      }
    }
  }
  return imageData;
};

const encodeCanvas = async (canvas) => {
  let smallest = null;
  for (const q of BG_QUALITIES) {
    const blob = await canvasToBlob(canvas, 'image/webp', q);
    if (!blob || blob.type !== 'image/webp') break;
    if (!smallest || blob.size < smallest.size) smallest = blob;
    if (blob.size <= IMAGE_MAX_BYTES) return blob;
  }
  if (!smallest) {
    const png = await canvasToBlob(canvas, 'image/png');
    if (png) smallest = png;
  }
  return smallest;
};

const enhanceCutout = async (blob) => {
  const bitmap = await createImageBitmap(blob);
  const full = makeCanvas(bitmap.width, bitmap.height);
  const fullCtx = full.getContext('2d', { willReadFrequently: true });
  fullCtx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const bounds = alphaBounds(fullCtx.getImageData(0, 0, full.width, full.height).data, full.width, full.height);
  const pad = Math.round(Math.max(bounds.w, bounds.h) * BG_PAD_RATIO);
  const sx = Math.max(0, bounds.x - pad);
  const sy = Math.max(0, bounds.y - pad);
  const sw = Math.min(full.width - sx, bounds.w + pad * 2);
  const sh = Math.min(full.height - sy, bounds.h + pad * 2);
  const { w, h } = fitSize(sw, sh, BG_OUTPUT_MAX);

  const out = makeCanvas(w, h);
  const ctx = out.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.filter = 'contrast(1.05) saturate(1.08) brightness(1.02)';
  ctx.drawImage(full, sx, sy, sw, sh, 0, 0, w, h);
  ctx.filter = 'none';
  ctx.putImageData(sharpen(ctx.getImageData(0, 0, w, h), BG_SHARPEN), 0, 0);

  full.width = 0;
  full.height = 0;
  return encodeCanvas(out);
};

const processProductImage = async (file, { onStage, onProgress, isCancelled }) => {
  onStage('prep');
  const [input, lib] = await Promise.all([downscaleInput(file), loadBgLib()]);
  if (isCancelled()) return null;

  const attempt = (device) => {
    const fetched = new Map();
    onProgress(0);
    onStage('download');
    return lib.removeBackground(input, {
      ...bgConfig(device),
      progress: (key, current, total) => {
        if (isCancelled()) return;
        if (String(key).startsWith('fetch')) {
          fetched.set(key, [current, total]);
          let cur = 0;
          let tot = 0;
          fetched.forEach(([c, t]) => { cur += c; tot += t; });
          const pct = tot > 0 ? Math.min(100, Math.round((cur / tot) * 100)) : 0;
          if (pct >= 100) {
            onStage('remove');
            onProgress(-1);
          } else {
            onStage('download');
            onProgress(pct);
          }
        } else {
          onStage('remove');
          onProgress(-1);
        }
      },
    });
  };

  const device = bgDevice();
  let cutout;
  try {
    cutout = await attempt(device);
  } catch (err) {
    if (device === 'gpu' && !isCancelled()) cutout = await attempt('cpu');
    else throw err;
  }
  if (isCancelled()) return null;

  onStage('enhance');
  onProgress(-1);
  const result = await enhanceCutout(cutout);
  if (isCancelled() || !result) return null;

  const base = file.name.replace(/\.[^.]+$/, '') || 'product';
  const ext = result.type === 'image/webp' ? 'webp' : 'png';
  return new File([result], `${base}-nobg.${ext}`, { type: result.type, lastModified: Date.now() });
};

const INPUT = 'pm-field h-10 px-3 text-sm font-semibold';
const NUM_INPUT = `${INPUT} text-right tabular-nums`;
const TEXTAREA = 'pm-field px-3 py-2 text-sm font-semibold resize-none';
const BTN_SMALL = 'pm-btn h-8 px-3 text-[11px] uppercase';
const BTN_SMALL_DANGER = `${BTN_SMALL} pm-btn-danger`;
const BTN_SMALL_ACCENT = `${BTN_SMALL} pm-btn-a`;
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

const Field = ({ label, htmlFor, tag, children }) => (
  <div>
    <label htmlFor={htmlFor} className="pm-label">
      {label}
      {tag && <span className="pm-muted ms-1.5 text-[10px] font-semibold normal-case">({tag})</span>}
    </label>
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

const ImagePicker = memo(({ image, isEdit, T, onChange, onClearError, onBusy }) => {
  const [imgError, setImgError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState('');
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(-1);
  const [processed, setProcessed] = useState(false);
  const fileRef = useRef(null);
  const originalRef = useRef(null);
  const jobRef = useRef(0);

  const isFile = image instanceof File;
  const busy = stage !== '';

  useEffect(() => {
    if (image instanceof File) {
      const url = URL.createObjectURL(image);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(resolveImageSrc(image));
    return undefined;
  }, [image]);

  useEffect(() => { onBusy(busy); }, [busy, onBusy]);

  useEffect(() => () => { jobRef.current += 1; }, []);

  const pickFile = useCallback(async (file) => {
    if (!file) return;
    const problem = await validateImageFile(file);
    onClearError();
    if (problem) { setImgError(problem); return; }
    jobRef.current += 1;
    setStage('');
    setImgError('');
    setProcessed(false);
    originalRef.current = file;
    onChange('image', file);
    preloadBgModel();
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
  const clear = useCallback(() => {
    jobRef.current += 1;
    originalRef.current = null;
    setStage('');
    setProcessed(false);
    onChange('image', null);
    setImgError('');
  }, [onChange]);
  const previewFail = useCallback(() => setPreview(''), []);

  const restore = useCallback(() => {
    if (!originalRef.current) return;
    jobRef.current += 1;
    setProcessed(false);
    setImgError('');
    onChange('image', originalRef.current);
  }, [onChange]);

  const cancelRun = useCallback(() => {
    jobRef.current += 1;
    setStage('');
    setProgress(-1);
  }, []);

  const stageUpdate = useCallback((next) => setStage((prev) => (prev === next ? prev : next)), []);
  const progressUpdate = useCallback((pct) => setProgress((prev) => (prev === pct ? prev : pct)), []);

  const run = useCallback(async () => {
    if (!(image instanceof File) || busy) return;
    if (!originalRef.current) originalRef.current = image;
    const job = jobRef.current + 1;
    jobRef.current = job;
    const isCancelled = () => jobRef.current !== job;
    setImgError('');
    setProgress(-1);
    stageUpdate('prep');
    try {
      const result = await processProductImage(originalRef.current, {
        onStage: (s) => { if (!isCancelled()) stageUpdate(s); },
        onProgress: (p) => { if (!isCancelled()) progressUpdate(p); },
        isCancelled,
      });
      if (isCancelled()) return;
      if (!result) throw new Error('empty');
      if (result.size > IMAGE_MAX_BYTES) {
        setImgError(tpl(T.bgTooLarge, { mb: MAX_MB }));
        return;
      }
      setProcessed(true);
      onChange('image', result);
    } catch {
      if (!isCancelled()) setImgError(T.bgError);
    } finally {
      if (!isCancelled()) {
        setStage('');
        setProgress(-1);
      }
    }
  }, [image, busy, T, onChange, stageUpdate, progressUpdate]);

  const indeterminate = progress < 0;

  return (
    <div>
      <span className="pm-label">{T.image}</span>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`pm-drop flex items-center gap-3 p-3 ${dragging ? 'pm-drop-on' : ''} ${imgError ? '!border-red-500' : ''}`}
      >
        <span className={`pm-card ${processed ? 'pm-checker' : ''} !shadow-none flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden`}>
          {preview
            ? <img src={preview} alt={T.imagePreviewAlt} decoding="async" className={`h-full w-full ${processed ? 'object-contain' : 'object-cover'}`} onError={previewFail} />
            : <FiUploadCloud size={24} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="pm-muted truncate text-[11px] font-bold">
            {isFile ? image.name : (isEdit && preview ? T.imageCurrent : T.imageDrop)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={browse} disabled={busy} className={BTN_SMALL}>
              <FiUploadCloud size={12} aria-hidden="true" /> {T.pickImage}
            </button>
            {isFile && !processed && (
              <button
                type="button"
                onClick={run}
                onPointerEnter={preloadBgModel}
                onFocus={preloadBgModel}
                disabled={busy}
                className={BTN_SMALL_ACCENT}
              >
                {busy
                  ? <FiLoader size={12} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                  : <FiZap size={12} aria-hidden="true" />}
                {T.removeBg}
              </button>
            )}
            {isFile && processed && (
              <button type="button" onClick={restore} disabled={busy} className={BTN_SMALL}>
                <FiRotateCcw size={12} aria-hidden="true" /> {T.restoreOriginal}
              </button>
            )}
            {busy && (
              <button type="button" onClick={cancelRun} className={BTN_SMALL_DANGER}>
                <FiX size={12} aria-hidden="true" /> {T.cancelProcessing}
              </button>
            )}
            {isFile && !busy && (
              <button type="button" onClick={clear} className={BTN_SMALL_DANGER}>
                <FiTrash2 size={12} aria-hidden="true" /> {T.removeImage}
              </button>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onFile} />
      </div>
      {busy && (
        <div className="mt-2" role="status" aria-live="polite">
          <p className="pm-muted mb-1 text-[11px] font-bold">{T.stages[stage]}</p>
          <div
            className={`pm-bar ${indeterminate ? 'pm-bar-wait' : ''}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={indeterminate ? undefined : progress}
          >
            <span style={indeterminate ? undefined : { width: `${progress}%` }} />
          </div>
        </div>
      )}
      {!busy && processed && !imgError && (
        <p role="status" className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
          <FiCheck size={12} aria-hidden="true" /> {T.bgDone}
        </p>
      )}
      <p className="pm-muted mt-1.5 text-[10px] font-semibold">{tpl(T.imageHint, { mb: MAX_MB })}</p>
      {isFile && !processed && !busy && <p className="pm-muted mt-1 text-[10px] font-semibold">{T.bgHint}</p>}
      {imgError && <p role="alert" className="mt-1 text-[11px] font-bold text-red-500">{imgError}</p>}
    </div>
  );
});

const SpecPreview = memo(({ value, T }) => {
  const lines = useMemo(() => parseSpecs(value), [value]);
  if (lines.length === 0) return null;
  const over = lines.length > SPEC_MAX_LINES;
  return (
    <div className="mt-2">
      <ul className="pm-drop pm-scroll max-h-28 space-y-1 overflow-y-auto p-2 text-[11px] font-semibold">
        {lines.slice(0, SPEC_MAX_LINES).map((line, i) => (
          <li key={i} className="flex min-w-0 gap-1.5">
            <span aria-hidden="true" className="flex-shrink-0">•</span>
            <span className="min-w-0 flex-1 break-words">{line}</span>
          </li>
        ))}
      </ul>
      <p className={`mt-1 text-[10px] font-bold ${over ? 'text-red-500' : 'pm-muted'}`}>
        {tpl(T.specCount, { n: lines.length, max: SPEC_MAX_LINES })}
      </p>
    </div>
  );
});

const FinalPriceNote = memo(({ amount, label, currency, locale }) => {
  const text = useMemo(
    () => (amount == null
      ? ''
      : new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)),
    [amount, locale],
  );
  if (!text) return null;
  return (
    <p className="pm-muted mt-2 text-[11px] font-bold">
      {label}: <span dir="ltr" className="pm-ul text-[var(--pm-ink)]">{text} {currency}</span>
    </p>
  );
});

const ProductModal = ({ mode, data, categories, onChange, onSubmit, onClose, busy = false }) => {
  useEscape(onClose);
  const { language, dir, font } = useShopLocale();
  const T = TRANSLATIONS[language === 'ar' ? 'ar' : 'en'];

  const [error, setError] = useState('');
  const [imgBusy, setImgBusy] = useState(false);

  const isEdit = mode === 'edit';
  const title = isEdit ? T.titleEdit : T.titleAdd;
  const locked = busy || imgBusy;

  const specsValue = asText(data.specifications);
  const discountValue = asDiscountText(data.discountValue);
  const discountType = data.discountType || DEFAULT_DISCOUNT_TYPE;

  useEffect(() => {
    if (!data.discountType) onChange('discountType', DEFAULT_DISCOUNT_TYPE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: String(c.id), label: String(c.name ?? '').slice(0, 60) })),
    [categories],
  );
  const conditionOptions = useMemo(
    () => CONDITIONS.map((c) => ({ value: c, label: T.conditions[c] || CONDITION_LABELS[c] || c })),
    [T],
  );
  const discountTypeOptions = useMemo(
    () => DISCOUNT_TYPES.map((t) => ({ value: t, label: T.discountTypes[t] })),
    [T],
  );

  const finalPrice = useMemo(
    () => computeFinalPrice(data.price, discountType, discountValue),
    [data.price, discountType, discountValue],
  );
  const numberLocale = language === 'ar' ? 'ar-EG' : 'en-US';

  const clearError = useCallback(() => setError(''), []);
  const onImgBusy = useCallback((v) => setImgBusy(v), []);

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
      specifications: mk('specifications', specsText),
      discountValue: mk('discountValue', discountMoney),
      category: (v) => { setError(''); onChange('categoryId', v); },
      condition: (v) => { setError(''); onChange('condition', v); },
      discountType: (v) => { setError(''); onChange('discountType', v); },
    };
  }, [onChange]);

  const submit = (e) => {
    e.preventDefault();
    if (locked) return;
    const problem = validateProduct(data, categories) || validateExtras(data, T);
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
            onBusy={onImgBusy}
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

          <Field label={T.specifications} htmlFor="p-specs" tag={T.optional}>
            <textarea
              id="p-specs" rows={3} maxLength={5000}
              value={specsValue} onChange={handlers.specifications}
              placeholder={T.specificationsPlaceholder}
              className={TEXTAREA}
            />
            <p className="pm-muted mt-1.5 text-[10px] font-semibold">{T.specificationsHint}</p>
            <SpecPreview value={specsValue} T={T} />
          </Field>

          <Field label={T.discount} htmlFor="p-disc-type" tag={T.optional}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Dropdown
                id="p-disc-type"
                dir={dir}
                value={discountType}
                options={discountTypeOptions}
                onChange={handlers.discountType}
              />
              <input
                id="p-disc-value" type="text" inputMode="decimal" dir="ltr" autoComplete="off"
                aria-label={T.discountValueLabel}
                value={discountValue} onChange={handlers.discountValue}
                placeholder={T.discountPlaceholders[discountType]}
                className={NUM_INPUT}
              />
            </div>
            <FinalPriceNote amount={finalPrice} label={T.finalPrice} currency={T.currency} locale={numberLocale} />
          </Field>

          {error && (
            <p role="alert" className="pm-card !shadow-none !border-red-500 flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-red-600 dark:text-red-300">
              <FiAlertCircle size={13} className="flex-shrink-0" aria-hidden="true" /> {error}
            </p>
          )}
        </div>

        <div className="pm-gray pm-line flex flex-shrink-0 gap-2.5 border-t-2 px-5 py-4">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_FOOT}>{T.cancel}</button>
          <button type="submit" disabled={locked} className={BTN_FOOT_PRIMARY}>
            {busy ? T.saving : isEdit ? T.save : T.add}
          </button>
        </div>
      </form>
    </Overlay>
  );
};

export default memo(ProductModal);