import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { FiUploadCloud, FiTrash2, FiRefreshCw, FiAlertTriangle, FiRepeat } from 'react-icons/fi';

export const LOGO_ACCEPT = 'image/jpeg,image/png,image/webp';
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const RAW_MAX_BYTES = 10 * 1024 * 1024;
const MAX_SIDE = 512;
const WEBP_QUALITY = 0.9;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const LOGO_CSS = `
.nb-drop{position:relative;border:2px dashed var(--nb-line);background:var(--nb-card);color:var(--nb-ink);transition:background-color .12s ease,transform .12s ease,box-shadow .12s ease}
.nb-drop[role=button]{cursor:pointer}
.nb-drop[role=button]:hover:not(.is-disabled){background:var(--nb-gray,rgba(16,185,129,.1))}
.nb-drop:focus-visible{outline:3px solid var(--nb-accent);outline-offset:2px}
.nb-drop.is-over{border-style:solid;border-color:var(--nb-accent);background:var(--nb-gray,rgba(16,185,129,.1));transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--nb-accent)}
.nb-drop.is-disabled{opacity:.6;cursor:not-allowed}
.nb-drop.is-err{border-color:#e11d48}
@media (prefers-reduced-motion:reduce){.nb-drop{transition:none}}
`;

const TXT = {
  en: {
    label: 'Shop logo (optional)', drop: 'Drag & drop your logo here', or: 'or', browse: 'browse files',
    hint: 'JPEG, PNG or WebP · up to 2 MB · saved as WebP', dropHere: 'Drop the image here', change: 'Change', remove: 'Remove',
    processing: 'Converting to WebP…', errType: 'Only JPEG, PNG or WebP images are allowed',
    errSize: 'Logo must be 2 MB or smaller', current: 'Current logo', noLogo: 'No logo yet', save: 'Save logo',
    saving: 'Saving…', cancel: 'Cancel', cardTitle: 'Shop logo', cardSub: 'Shown on your shop page and in listings',
    confirmRemoveTitle: 'Remove logo?', confirmRemoveText: 'Your shop will show its first letter instead of the logo.',
    removed: 'Logo removed', removeFail: 'Could not remove the logo', removing: 'Removing…',
    warnTitle: 'Logo not saved', warn: 'Your account was created but the logo could not be saved. You can add it later from your profile.',
  },
  ar: {
    label: 'شعار المتجر (اختياري)', drop: 'اسحب الشعار وأفلته هنا', or: 'أو', browse: 'تصفح الملفات',
    hint: 'JPEG أو PNG أو WebP · حتى 2 ميجابايت · يُحفظ بصيغة WebP', dropHere: 'أفلت الصورة هنا', change: 'تغيير', remove: 'حذف',
    processing: 'جارٍ التحويل إلى WebP…', errType: 'يُسمح فقط بصور JPEG أو PNG أو WebP',
    errSize: 'يجب ألا يتجاوز حجم الشعار 2 ميجابايت', current: 'الشعار الحالي', noLogo: 'لا يوجد شعار', save: 'حفظ الشعار',
    saving: 'جارٍ الحفظ…', cancel: 'إلغاء', cardTitle: 'شعار المتجر', cardSub: 'يظهر في صفحة متجرك وفي القوائم',
    confirmRemoveTitle: 'حذف الشعار؟', confirmRemoveText: 'سيعرض متجرك الحرف الأول من اسمه بدلاً من الشعار.',
    removed: 'تم حذف الشعار', removeFail: 'تعذر حذف الشعار', removing: 'جارٍ الحذف…',
    warnTitle: 'لم يتم حفظ الشعار', warn: 'تم إنشاء حسابك لكن تعذر حفظ الشعار. يمكنك إضافته لاحقًا من ملفك الشخصي.',
  },
  fr: {
    label: 'Logo de la boutique (facultatif)', drop: 'Glissez-déposez votre logo ici', or: 'ou', browse: 'parcourir les fichiers',
    hint: 'JPEG, PNG ou WebP · jusqu’à 2 Mo · enregistré en WebP', dropHere: 'Déposez l’image ici', change: 'Changer', remove: 'Supprimer',
    processing: 'Conversion en WebP…', errType: 'Seules les images JPEG, PNG ou WebP sont acceptées',
    errSize: 'Le logo ne doit pas dépasser 2 Mo', current: 'Logo actuel', noLogo: 'Pas encore de logo', save: 'Enregistrer le logo',
    saving: 'Enregistrement…', cancel: 'Annuler', cardTitle: 'Logo de la boutique', cardSub: 'Affiché sur votre page et dans les listes',
    confirmRemoveTitle: 'Supprimer le logo ?', confirmRemoveText: 'Votre boutique affichera sa première lettre à la place du logo.',
    removed: 'Logo supprimé', removeFail: 'Impossible de supprimer le logo', removing: 'Suppression…',
    warnTitle: 'Logo non enregistré', warn: 'Votre compte a été créé mais le logo n’a pas pu être enregistré. Vous pourrez l’ajouter depuis votre profil.',
  },
};
export const getLogoT = (language) => TXT[language] || TXT.en;

const fmtSize = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const webpName = (name) => `${String(name || 'logo').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_').slice(0, 60) || 'logo'}.webp`;

export const optimizeLogo = async (file) => {
  try {
    if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (file.type === 'image/webp' && scale === 1) {
      bmp.close?.();
      return file;
    }
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY));
    if (!blob || blob.type !== 'image/webp') return file;
    return new File([blob], webpName(file.name), { type: 'image/webp', lastModified: Date.now() });
  } catch {
    return file;
  }
};

export const prepareLogoFile = async (picked, t) => {
  if (!picked) return { error: '' };
  if (!TYPES.has(picked.type)) return { error: t.errType };
  if (picked.size > RAW_MAX_BYTES) return { error: t.errSize };
  const out = await optimizeLogo(picked);
  if (out.size > LOGO_MAX_BYTES) return { error: t.errSize };
  return { file: out };
};

const useObjectUrl = (file) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) { setUrl(''); return undefined; }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
};

export const LogoDropzone = memo(({ id, file, onChange, disabled = false, language = 'en', compact = false }) => {
  const t = getLogoT(language);
  const inputRef = useRef(null);
  const depth = useRef(0);
  const ticket = useRef(0);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const preview = useObjectUrl(file);
  const locked = disabled || busy;

  useEffect(() => () => { ticket.current = -1; }, []);

  const accept = useCallback(async (picked) => {
    if (!picked) return;
    const mine = ++ticket.current;
    setError('');
    setBusy(true);
    const res = await prepareLogoFile(picked, t);
    if (ticket.current !== mine) return;
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    onChange(res.file);
  }, [onChange, t]);

  const open = useCallback(() => { if (!locked) inputRef.current?.click(); }, [locked]);
  const onKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  }, [open]);

  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    if (locked) return;
    depth.current += 1;
    setOver(true);
  }, [locked]);
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = locked ? 'none' : 'copy';
  }, [locked]);
  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (!depth.current) setOver(false);
  }, []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    depth.current = 0;
    setOver(false);
    if (locked) return;
    accept(e.dataTransfer?.files?.[0]);
  }, [locked, accept]);

  const onInput = useCallback((e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    accept(picked);
  }, [accept]);

  const clear = useCallback(() => { setError(''); onChange(null); }, [onChange]);

  const areaProps = file || busy ? {} : {
    role: 'button', tabIndex: locked ? -1 : 0, 'aria-disabled': locked, 'aria-label': t.drop, onClick: open, onKeyDown: onKey,
  };

  return (
    <div className="space-y-1.5">
      <div
        className={`nb-drop ${compact ? 'p-3' : 'p-4'} ${over ? 'is-over' : ''} ${locked ? 'is-disabled' : ''} ${error ? 'is-err' : ''}`}
        onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        {...areaProps}
      >
        {busy ? (
          <div className="flex items-center justify-center gap-2 py-2 text-xs font-extrabold uppercase" aria-live="polite">
            <FiRefreshCw size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> {t.processing}
          </div>
        ) : over ? (
          <div className="flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase">
            <FiUploadCloud size={18} className="nb-ic" aria-hidden="true" /> {t.dropHere}
          </div>
        ) : file ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="nb-gray flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden" style={{ border: '2px solid var(--nb-line)' }}>
              {preview && <img src={preview} alt="" width={56} height={56} decoding="async" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p dir="ltr" className="truncate text-start text-xs font-extrabold">{file.name}</p>
              <p className="nb-muted text-[10px] font-bold tabular-nums">{fmtSize(file.size)}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <button type="button" onClick={open} disabled={locked} className="nb-btn px-3 py-1.5 text-[11px] uppercase">
                <FiRepeat size={12} aria-hidden="true" /> {t.change}
              </button>
              <button type="button" onClick={clear} disabled={locked} className="nb-btn px-3 py-1.5 text-[11px] uppercase !text-red-600 dark:!text-red-300">
                <FiTrash2 size={12} aria-hidden="true" /> {t.remove}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-2 text-center">
            <FiUploadCloud size={compact ? 22 : 26} className="nb-ic" aria-hidden="true" />
            <p className="text-xs font-extrabold">
              {t.drop} <span className="nb-muted font-semibold">{t.or}</span> <span className="nb-link">{t.browse}</span>
            </p>
            <p className="nb-muted text-[10px] font-semibold">{t.hint}</p>
          </div>
        )}
      </div>
      <input id={id} ref={inputRef} type="file" accept={LOGO_ACCEPT} className="sr-only" tabIndex={-1} disabled={locked} onChange={onInput} />
      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs font-bold text-rose-500">
          <FiAlertTriangle aria-hidden="true" className="h-3 w-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  );
});