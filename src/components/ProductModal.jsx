import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { FiBox, FiX, FiUploadCloud, FiImage, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';

const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'];
const CONDITION_LABELS = { NEW: 'جديد', USED: 'مستعمل', REFURBISHED: 'مجدّد' };

const UploadIllustration = memo(({ active }) => (
  <svg viewBox="0 0 64 64" className="w-14 h-14">
    <motion.path
      d="M18,44 a12,12 0 0,1 -2,-23.8 A16,16 0 0,1 47,17 a11,11 0 0,1 -1,22"
      fill="none"
      stroke={active ? '#10b981' : '#9ca3af'}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <motion.g
      animate={{ y: active ? [4, -3, 4] : 0 }}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <line x1="32" y1="28" x2="32" y2="46" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M25,35 L32,28 L39,35" fill="none" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </motion.g>
  </svg>
));

// `value` is either a File the user just picked (add/edit) or an existing image URL string (edit, unchanged).
// `onChange` receives the raw File object — Products.jsx sends it as multipart/form-data, not base64.
const ImageDropzone = memo(({ value, onChange }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [objectUrl, setObjectUrl] = useState(null);

  // Build/revoke a preview URL whenever a new File is selected.
  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [value]);

  const previewSrc = value instanceof File ? objectUrl : (value || '');

  const pickFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    onChange(file);
  }, [onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }, [pickFile]);

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">صورة المنتج <span className="text-red-400">*</span></label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />
      {previewSrc ? (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 group">
          <img src={previewSrc} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gray-900/0 group-hover:bg-gray-900/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-white text-[10px] font-black text-gray-700 uppercase tracking-widest"
            >
              تغيير
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-2.5 rounded-xl bg-red-500 text-white"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            dragOver
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 hover:border-emerald-300'
          }`}
        >
          <UploadIllustration active={dragOver} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            اسحب الصورة هنا أو اضغط للاختيار
          </p>
        </div>
      )}
    </div>
  );
});

const ProductForm = memo(({ data, onChange, categories }) => {
  const condOptions = CONDITIONS.map(c => ({ value: c, label: CONDITION_LABELS[c] }));
  const catOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">اسم المنتج <span className="text-red-400">*</span></label>
        <input type="text" value={data.name} onChange={e => onChange('name', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">السعر (ج.م) <span className="text-red-400">*</span></label>
        <input type="number" value={data.price} onChange={e => onChange('price', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">وصف المنتج <span className="text-red-400">*</span></label>
        <textarea value={data.description} onChange={e => onChange('description', e.target.value)} rows="3" className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all resize-none" />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">حالة المنتج <span className="text-red-400">*</span></label>
        <select value={data.condition} onChange={e => onChange('condition', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all cursor-pointer">
          {condOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">فئة المنتج <span className="text-red-400">*</span></label>
        {/* Writes categoryId directly, matching the v2 payload's flat shape. */}
        <select
          value={data.categoryId || ''}
          onChange={e => onChange('categoryId', e.target.value)}
          className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all cursor-pointer"
        >
          <option value="">اختر الفئة</option>
          {catOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الكمية <span className="text-red-400">*</span></label>
        <input type="number" value={data.stockQuantity} onChange={e => onChange('stockQuantity', e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-sm font-bold text-gray-900 dark:text-white focus:outline-none transition-all" />
      </div>
      <div className="md:col-span-2">
        <ImageDropzone value={data.image} onChange={(v) => onChange('image', v)} />
      </div>
    </div>
  );
});

const ProductModal = ({ mode, data, categories, onChange, onSubmit, onClose }) => {
  const isAdd = mode === 'add';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-none shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] custom-scrollbar-thin"
      >
        <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FiBox size={20} />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">{isAdd ? 'إضافة منتج جديد' : 'تعديل بيانات المنتج'}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
            <FiX size={18} />
          </button>
        </div>

        <div className="p-8">
          <ProductForm data={data} categories={categories} onChange={onChange} />
        </div>

        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-700 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-all">إلغاء</button>
          <button onClick={onSubmit} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">{isAdd ? 'إضافة المنتج' : 'حفظ التعديلات'}</button>
        </div>
      </motion.div>
    </div>
  );
};

export default memo(ProductModal);