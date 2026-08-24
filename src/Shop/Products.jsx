import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo, Suspense, lazy,
} from 'react';
import {
  FiPackage, FiPlus, FiSearch, FiChevronDown, FiChevronRight, FiChevronLeft,
  FiImage, FiX, FiEdit3, FiTrash2, FiFilter, FiAlertCircle,
} from 'react-icons/fi';
import api from '../api';
import debounce from 'lodash/debounce';

const ProductModal = lazy(() => import('../components/ProductModal'));

const ROWS_OPTIONS = [5, 10, 25, 50];

const formatPrice = (p) => `EGP ${Number(p || 0).toLocaleString('en-US')}`;

const CONDITION_LABELS = { NEW: 'جديد', USED: 'مستعمل', REFURBISHED: 'مجدّد', all: 'كل الحالات' };
const CONDITIONS = ['NEW', 'USED', 'REFURBISHED'];
const CONDITION_STYLE = {
  NEW: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  USED: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600', dot: 'bg-amber-500' },
  REFURBISHED: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
};
const getCondStyle = (c) => CONDITION_STYLE[c] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };

const STOCK_STATUSES = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'in', label: 'متوفر بالمخزون' },
  { value: 'out', label: 'نفد المخزون' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'الاسم أ-ي' },
  { value: 'highest_price', label: 'الأعلى سعراً' },
  { value: 'lowest_price', label: 'الأقل سعراً' },
  { value: 'highest_stock', label: 'الأعلى مخزوناً' },
  { value: 'lowest_stock', label: 'الأقل مخزوناً' },
];

// NOTE: `categoryId` matches the /api/shops/products/v2 payload directly.
// `image` holds a File object once picked (sent as multipart/form-data) — never a base64 string.
const EMPTY_PRODUCT = { name: '', description: '', price: '', categoryId: '', stockQuantity: '', condition: 'NEW', image: null };

let swalPromise = null;
const loadSwal = () => {
  if (!swalPromise) swalPromise = import('sweetalert2').then((m) => m.default);
  return swalPromise;
};

const EmptyProductsIllustration = memo(() => (
  <svg viewBox="0 0 140 110" className="w-28 h-24 mx-auto">
    <ellipse cx="70" cy="96" rx="42" ry="6" fill="rgba(0,0,0,0.05)" className="dark:fill-white/5" />
    <path d="M24 42 L70 24 L116 42 L116 78 L70 92 L24 78 Z" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2" className="dark:fill-gray-800 dark:stroke-gray-700" />
    <path d="M24 42 L70 58 L116 42" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <path d="M70 58 L70 92" fill="none" stroke="#e5e7eb" strokeWidth="2" className="dark:stroke-gray-700" />
    <path d="M46 34 L94 50" fill="none" stroke="#d1d5db" strokeWidth="2" className="dark:stroke-gray-600" />
    <circle cx="70" cy="16" r="8" fill="none" stroke="#10b981" strokeWidth="2.4" />
    <path d="M65 16 h10 M70 11 v10" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
  </svg>
));
EmptyProductsIllustration.displayName = 'EmptyProductsIllustration';

const CrateIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#84cc16" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#84cc16" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M16 22 L32 14 L48 22 L48 42 L32 50 L16 42 Z" fill="none" stroke="#84cc16" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M16 22 L32 30 L48 22" fill="none" stroke="#84cc16" strokeWidth="2.4" strokeLinejoin="round" />
    <line x1="32" y1="30" x2="32" y2="50" stroke="#84cc16" strokeWidth="2.2" />
  </svg>
));
CrateIllustration.displayName = 'CrateIllustration';

const ShieldCheckIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#10b981" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M32 15 L44 19 L44 30 C44 38 39 42 32 45 C25 42 20 38 20 30 L20 19 Z" fill="none" stroke="#10b981" strokeWidth="2.4" strokeLinejoin="round" className="dark:stroke-emerald-400" />
    <path d="M27 30 L31 34 L38 25" fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-emerald-400" />
  </svg>
));
ShieldCheckIllustration.displayName = 'ShieldCheckIllustration';

const SparkleTagIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#3b82f6" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M18 18 L34 18 L46 30 L30 46 L18 34 Z" fill="none" stroke="#3b82f6" strokeWidth="2.4" strokeLinejoin="round" />
    <circle cx="24" cy="24" r="2.6" fill="#3b82f6" />
    <path d="M46 14 L47.7 18.3 L52 20 L47.7 21.7 L46 26 L44.3 21.7 L40 20 L44.3 18.3 Z" fill="#3b82f6" />
  </svg>
));
SparkleTagIllustration.displayName = 'SparkleTagIllustration';

const RecycleWaveIllustration = memo(() => (
  <svg viewBox="0 0 64 64" className="w-full h-full">
    <circle cx="32" cy="32" r="27" fill="#f97316" opacity="0.12" />
    <circle cx="32" cy="32" r="19" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
    <path d="M15 32 H24 L28 20 L35 44 L40 32 H49" fill="none" stroke="#f97316" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
));
RecycleWaveIllustration.displayName = 'RecycleWaveIllustration';

const ModalFallback = () => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
    <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-16 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
    </div>
  </div>
);

const RowsDropdown = memo(({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between gap-3 min-w-[168px] px-5 py-3.5 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 cursor-pointer transition-all"
      >
        {value} منتجات لكل صفحة
        <FiChevronDown className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} size={14} />
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
          {options.map((n) => (
            <button
              key={n}
              onClick={() => { onChange(n); setOpen(false); }}
              className={`w-full text-right px-5 py-2.5 text-xs font-bold transition ${
                value === n ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/60'
              }`}
            >
              {n} منتجات لكل صفحة
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
RowsDropdown.displayName = 'RowsDropdown';

const STAT_ILLUSTRATIONS = {
  'إجمالي المنتجات': CrateIllustration,
  'متوفر حالياً': ShieldCheckIllustration,
  'حالة جديدة': SparkleTagIllustration,
  'مستعمل / مجدد': RecycleWaveIllustration,
};

const StatCard = memo(({ label, value, description }) => {
  const Illustration = STAT_ILLUSTRATIONS[label];
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none">
      <div className="w-11 h-11 flex-shrink-0 group-hover:scale-105 transition-transform">
        {Illustration && <Illustration />}
      </div>
      <div className="min-w-0 text-right">
        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 truncate">{label}</p>
        <p className="text-xl font-black text-gray-900 dark:text-white leading-tight">{value}</p>
        <p className="text-[9px] font-bold text-gray-400 truncate">{description}</p>
      </div>
    </div>
  );
});
StatCard.displayName = 'StatCard';

const LEGEND_ITEMS = [
  { icon: FiEdit3, tone: 'text-amber-500 border-amber-200 dark:border-amber-900/50', label: 'تعديل', desc: 'تحديث بيانات المنتج وصورته وسعره' },
  { icon: FiTrash2, tone: 'text-red-600 border-red-200 dark:border-red-900/50', label: 'حذف', desc: 'إزالة المنتج نهائياً من الكتالوج' },
];

const IconLegendCard = memo(() => (
  <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-5">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-400">
        <FiAlertCircle size={13} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">دليل الأيقونات</p>
    </div>
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      {LEGEND_ITEMS.map(({ icon: Icon, tone, label, desc }) => (
        <div key={label} className="flex items-start gap-3 min-w-[200px] flex-1">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${tone}`}>
            <Icon size={13} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-gray-900 dark:text-white">{label}</p>
            <p className="text-[10px] font-bold text-gray-400 leading-relaxed mt-0.5">{desc}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-start gap-1.5">
      <FiAlertCircle className="text-blue-500 flex-shrink-0 mt-0.5" size={12} />
      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
        المنتجات التي نفد مخزونها تظهر بلون أحمر في عمود المخزون لتنبيهك بضرورة إعادة التخزين.
      </p>
    </div>
  </div>
));
IconLegendCard.displayName = 'IconLegendCard';

const ProductRow = memo(({ product, onEdit, onDelete }) => {
  const cs = getCondStyle(product.condition);
  return (
    <tr className="hover:bg-emerald-50/10 dark:hover:bg-emerald-900/5 transition-colors group">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-300 overflow-hidden border border-gray-100 dark:border-gray-700">
            {product.imageUrl ? (
              <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} loading="lazy" />
            ) : (
              <FiImage size={20} />
            )}
          </div>
          <div>
            <p className="text-xs font-black text-gray-900 dark:text-white">{product.name}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{product.categoryName || 'غير مصنف'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${cs.bg} ${cs.text}`}>
          {CONDITION_LABELS[product.condition] || product.condition}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center font-mono font-black text-xs text-emerald-600">
        {formatPrice(product.price)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-center">
        <p className={`text-sm font-black ${(product.stock ?? 0) > 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>{product.stock ?? 0}</p>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">وحدة متوفرة</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-left">
        <div className="flex items-center justify-start gap-1.5">
          <button title="تعديل المنتج" onClick={() => onEdit(product)} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all active:scale-95">
            <FiEdit3 size={14} />
          </button>
          <button title="حذف المنتج" onClick={() => onDelete(product.id)} className="p-2 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95">
            <FiTrash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});
ProductRow.displayName = 'ProductRow';

const FilterPanel = memo(({
  conditionFilter, onConditionChange, categoryFilter, onCategoryChange,
  categories, stockFilter, onStockChange, sortBy, onSortChange, onClose,
}) => (
  <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
    <div className="relative w-full lg:max-w-md bg-white dark:bg-gray-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-20 duration-500 max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تصفية المنتجات</h3>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">خصص طريقة عرض الكتالوج</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
          <FiX size={16} />
        </button>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar-thin">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">حالة المنتج</p>
          <div className="grid grid-cols-2 gap-3">
            {['all', ...CONDITIONS].map((c) => (
              <button
                key={c}
                onClick={() => onConditionChange(c)}
                className={`px-4 py-3.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  conditionFilter === c
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'
                }`}
              >
                {CONDITION_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">حالة المخزون</p>
          <div className="flex flex-wrap gap-2">
            {STOCK_STATUSES.map((o) => (
              <button
                key={o.value}
                onClick={() => onStockChange(o.value)}
                className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  stockFilter === o.value
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-emerald-500 hover:text-emerald-600'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">الفئة</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onCategoryChange('all')}
                className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-gray-900 dark:bg-emerald-500 border-gray-900 dark:border-emerald-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                }`}
              >
                كل الفئات
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategoryChange(c.id)}
                  className={`px-4 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    categoryFilter === c.id
                      ? 'bg-gray-900 dark:bg-emerald-500 border-gray-900 dark:border-emerald-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">الترتيب حسب</p>
          <div className="grid grid-cols-2 gap-3">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => onSortChange(o.value)}
                className={`px-4 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  sortBy === o.value
                    ? 'bg-gray-900 dark:bg-emerald-500 border-gray-900 dark:border-emerald-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-gray-400'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-50 dark:border-gray-700 flex-shrink-0">
        <button onClick={onClose} className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
          تطبيق الفلاتر
        </button>
      </div>
    </div>
  </div>
));
FilterPanel.displayName = 'FilterPanel';

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [conditionFilter, setConditionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [newStockValue, setNewStockValue] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);

  useEffect(() => { document.title = 'إدارة المنتجات'; }, []);

  const showToast = useCallback(async (text, icon) => {
    const Swal = await loadSwal();
    Swal.fire({
      text, icon, toast: true, position: 'top-start',
      showConfirmButton: false, timer: 3000,
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shops/products');
      setAllProducts(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  const debouncedApiSearch = useRef(
    debounce(async (q) => {
      if (!q) return;
      try {
        const res = await api.get('/api/shops/products', { params: { query: q } });
        setAllProducts(Array.isArray(res.data) ? res.data : res.data.content || []);
      } catch { }
    }, 400),
  ).current;

  useEffect(() => {
    fetchProducts();
    return () => debouncedApiSearch.cancel();
  }, [fetchProducts, debouncedApiSearch]);

  useEffect(() => {
    if (searchTerm.trim()) {
      debouncedApiSearch(searchTerm.trim());
    } else {
      debouncedApiSearch.cancel();
      fetchProducts();
    }
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories');
      setCategories(Array.isArray(res.data) ? res.data : res.data.content || []);
    } catch { }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const products = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let list = allProducts;

    if (q) {
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q));
    }

    if (conditionFilter !== 'all') {
      list = list.filter((p) => p.condition === conditionFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.categoryId === categoryFilter);
    }
    if (stockFilter === 'in') {
      list = list.filter((p) => (p.stock ?? 0) > 0);
    } else if (stockFilter === 'out') {
      list = list.filter((p) => (p.stock ?? 0) === 0);
    }

    const sorted = [...list];
    if (sortBy === 'highest_price') sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'lowest_price') sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'highest_stock') sorted.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    else if (sortBy === 'lowest_stock') sorted.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    else sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));

    return sorted;
  }, [allProducts, searchTerm, conditionFilter, categoryFilter, stockFilter, sortBy]);

  const stats = useMemo(() => ({
    total: allProducts.length,
    inStock: allProducts.filter((p) => (p.stock ?? 0) > 0).length,
    newCond: allProducts.filter((p) => p.condition === 'NEW').length,
    usedOrRefurb: allProducts.filter((p) => p.condition !== 'NEW').length,
  }), [allProducts]);

  const paginated = useMemo(() => products.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage), [products, currentPage, rowsPerPage]);
  const totalPages = Math.ceil(products.length / rowsPerPage);

  // Shared validation for the v2 payload: name, description, price, categoryId, stockQuantity, condition, image are all required.
  const validateProduct = useCallback((p) => {
    if (!p.name?.trim()) return 'اسم المنتج مطلوب';
    if (!p.description?.trim()) return 'وصف المنتج مطلوب';
    if (p.price === '' || p.price === null || Number(p.price) <= 0) return 'السعر مطلوب';
    if (!p.categoryId) return 'يرجى اختيار فئة';
    if (p.stockQuantity === '' || p.stockQuantity === null || Number(p.stockQuantity) < 0) return 'الكمية مطلوبة';
    if (!p.condition) return 'حالة المنتج مطلوبة';
    if (!p.image) return 'صورة المنتج مطلوبة';
    return null;
  }, []);

  // The backend expects multipart/form-data so it can receive an actual image file alongside the fields.
  const buildFormData = useCallback((p) => {
    const fd = new FormData();
    fd.append('name', p.name.trim());
    fd.append('description', p.description.trim());
    fd.append('price', Number(p.price) || 0);
    fd.append('categoryId', p.categoryId);
    fd.append('stockQuantity', Number(p.stockQuantity) || 0);
    fd.append('condition', p.condition);
    // Only attach when a new file was picked — on edit, an unchanged image stays a URL string and is skipped
    // so the backend keeps the existing image.
    if (p.image instanceof File) fd.append('image', p.image);
    return fd;
  }, []);

  const addProduct = useCallback(async () => {
    const error = validateProduct(newProduct);
    if (error) { showToast(error, 'error'); return; }

    const formData = buildFormData(newProduct);
    const categoryName = categories.find((c) => c.id === newProduct.categoryId)?.name || '';
    const previewUrl = newProduct.image instanceof File ? URL.createObjectURL(newProduct.image) : '';

    const tempId = Date.now();
    const optimisticProduct = {
      id: tempId,
      name: newProduct.name.trim(),
      description: newProduct.description.trim(),
      price: Number(newProduct.price) || 0,
      categoryId: newProduct.categoryId,
      stock: Number(newProduct.stockQuantity) || 0,
      condition: newProduct.condition,
      imageUrl: previewUrl,
      categoryName,
    };
    setAllProducts((prev) => [optimisticProduct, ...prev]);
    setShowAddModal(false);
    setNewProduct(EMPTY_PRODUCT);

    try {
      const res = await api.post('/api/shops/products/v2', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAllProducts((prev) => prev.map((p) => (p.id === tempId ? res.data : p)));
      showToast('تم إضافة المنتج بنجاح', 'success');
    } catch {
      setAllProducts((prev) => prev.filter((p) => p.id !== tempId));
      showToast('فشل في الإضافة', 'error');
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }, [newProduct, categories, buildFormData, validateProduct, showToast]);

  const updateProduct = useCallback(async () => {
    const error = validateProduct(editingProduct);
    if (error) { showToast(error, 'error'); return; }

    const formData = buildFormData(editingProduct);
    const categoryName = categories.find((c) => c.id === editingProduct.categoryId)?.name || '';
    const previewUrl = editingProduct.image instanceof File ? URL.createObjectURL(editingProduct.image) : editingProduct.image;

    const previousProducts = [...allProducts];
    setAllProducts((prev) => prev.map((p) => (p.id === editingProduct.id
      ? {
        ...p,
        name: editingProduct.name.trim(),
        description: editingProduct.description.trim(),
        price: Number(editingProduct.price) || 0,
        categoryId: editingProduct.categoryId,
        stock: Number(editingProduct.stockQuantity) || 0,
        condition: editingProduct.condition,
        imageUrl: previewUrl,
        categoryName,
      }
      : p)));
    setShowEditModal(false);

    try {
      const res = await api.put(`/api/shops/products/${editingProduct.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAllProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? res.data : p)));
      showToast('تم تعديل المنتج بنجاح', 'success');
    } catch {
      setAllProducts(previousProducts);
      showToast('خطأ في تعديل المنتج', 'error');
    }
  }, [editingProduct, allProducts, categories, buildFormData, validateProduct, showToast]);

  const updateStock = useCallback(async () => {
    if (newStockValue === '' || newStockValue < 0) return;
    const targetId = stockTarget.id;
    const nextStock = parseInt(newStockValue, 10);

    const previousProducts = [...allProducts];
    setAllProducts((prev) => prev.map((p) => (p.id === targetId ? { ...p, stock: nextStock } : p)));
    setShowStockModal(false);

    try {
      await api.patch(`/api/shops/products/${targetId}/stock`, { newStock: nextStock });
      showToast('تم تحديث المخزون', 'success');
    } catch {
      setAllProducts(previousProducts);
      showToast('خطأ في تحديث المخزون', 'error');
    }
  }, [newStockValue, stockTarget, allProducts, showToast]);

  const deleteProduct = useCallback(async (id) => {
    const Swal = await loadSwal();
    const result = await Swal.fire({
      title: 'تأكيد الحذف', text: 'هل تريد حذف المنتج نهائياً؟', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم، احذف', cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    const previousProducts = [...allProducts];
    setAllProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await api.delete(`/api/shops/products/${id}`);
      showToast('تم حذف المنتج', 'success');
    } catch {
      setAllProducts(previousProducts);
      showToast('خطأ في حذف المنتج', 'error');
    }
  }, [allProducts, showToast]);

  const closeModals = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
  }, []);

  const handleAddChange = useCallback((f, v) => setNewProduct((prev) => ({ ...prev, [f]: v })), []);
  const handleEditChange = useCallback((f, v) => setEditingProduct((prev) => ({ ...prev, [f]: v })), []);

  const openEdit = useCallback((p) => {
    setEditingProduct({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      categoryId: p.categoryId,
      stockQuantity: p.stock,
      condition: p.condition,
      // Starts as the existing image URL (string) so the dropzone previews it as-is.
      // Only becomes a File if the user picks a new image, which is what gets uploaded.
      image: p.imageUrl,
    });
    setShowEditModal(true);
  }, []);

  const statCards = useMemo(() => [
    { label: 'إجمالي المنتجات', value: stats.total.toLocaleString('ar-EG'), description: 'جميع المنتجات المسجلة' },
    { label: 'متوفر حالياً', value: stats.inStock.toLocaleString('ar-EG'), description: 'منتجات متاحة للبيع' },
    { label: 'حالة جديدة', value: stats.newCond.toLocaleString('ar-EG'), description: 'منتجات بحالة المصنع' },
    { label: 'مستعمل / مجدد', value: stats.usedOrRefurb.toLocaleString('ar-EG'), description: 'منتجات مجددة أو مستعملة' },
  ], [stats]);

  const activeFilterCount = (conditionFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0) + (stockFilter !== 'all' ? 1 : 0) + (sortBy !== 'name' ? 1 : 0);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pr-64 mt-16 transition-all duration-500 font-cairo text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end mt-3 justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">كتالوج المنتجات</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">إدارة <span className="text-emerald-500">المنتجات</span></h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">تحكم في منتجات متجرك، حدث الأسعار، وراقب توفر المخزون</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              title="تصفية النتائج"
              onClick={() => setShowFilterPanel(true)}
              className="relative flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-black uppercase tracking-widest hover:border-emerald-300 hover:text-emerald-600 transition-all active:scale-95"
            >
              <FiFilter size={16} /> تصفية
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">{activeFilterCount}</span>
              )}
            </button>
            <button
              title="إضافة منتج جديد"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gray-900 dark:bg-emerald-500 text-white dark:text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-gray-900/10 active:scale-95"
            >
              <FiPlus size={16} /> إضافة منتج جديد
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 group">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lime-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ابحث بالاسم، الفئة أو المواصفات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3.5 cursor-pointer rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-200 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-400 transition-colors"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
            <RowsDropdown value={rowsPerPage} onChange={(n) => { setRowsPerPage(n); setCurrentPage(1); }} options={ROWS_OPTIONS} />
          </div>

          {searchTerm && (
            <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
              {products.length === 0
                ? 'لا توجد نتائج مطابقة'
                : `${products.length} نتيجة لـ "${searchTerm}"`}
            </p>
          )}
        </div>

        <IconLegendCard />

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar-thin">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900 dark:border-gray-700">
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">المنتج</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">الحالة</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">السعر</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">المخزون</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading ? (
                    [...Array(rowsPerPage)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {[...Array(5)].map((_, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-lg w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-24 text-center">
                        <div className="mb-6">
                          <EmptyProductsIllustration />
                        </div>
                        <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                          {searchTerm ? 'لا توجد نتائج مطابقة' : 'لا توجد منتجات'}
                        </p>
                        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">
                          {searchTerm ? `لم يتم العثور على "${searchTerm}"` : 'كتالوج المنتجات فارغ حالياً'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((p) => (
                      <ProductRow
                        key={p.id}
                        product={p}
                        onEdit={openEdit}
                        onDelete={deleteProduct}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest order-2 sm:order-1">
                  عرض <span className="text-gray-900 dark:text-white">{(currentPage - 1) * rowsPerPage + 1}</span> إلى <span className="text-gray-900 dark:text-white">{Math.min(currentPage * rowsPerPage, products.length)}</span> من <span className="text-gray-900 dark:text-white">{products.length}</span> منتج
                </p>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-emerald-500 hover:border-emerald-300 disabled:opacity-30 transition-all">
                    <FiChevronRight size={20} />
                  </button>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-emerald-500 hover:border-emerald-300 disabled:opacity-30 transition-all">
                    <FiChevronLeft size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={<ModalFallback />}>
        {showAddModal && (
          <ProductModal
            mode="add"
            data={newProduct}
            categories={categories}
            onChange={handleAddChange}
            onSubmit={addProduct}
            onClose={closeModals}
          />
        )}
        {showEditModal && editingProduct && (
          <ProductModal
            mode="edit"
            data={editingProduct}
            categories={categories}
            onChange={handleEditChange}
            onSubmit={updateProduct}
            onClose={closeModals}
          />
        )}
      </Suspense>

      {showFilterPanel && (
        <FilterPanel
          conditionFilter={conditionFilter}
          onConditionChange={(c) => { setConditionFilter(c); setCurrentPage(1); }}
          categoryFilter={categoryFilter}
          onCategoryChange={(c) => { setCategoryFilter(c); setCurrentPage(1); }}
          categories={categories}
          stockFilter={stockFilter}
          onStockChange={(s) => { setStockFilter(s); setCurrentPage(1); }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {showStockModal && stockTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowStockModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 dark:border-gray-700">
              <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">تعديل المخزون</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">تحديث الكمية المتوفرة</p>
            </div>
            <div className="p-8 space-y-6 text-right">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">الكمية الحالية</span>
                <span className="text-sm font-black text-gray-900 dark:text-white">{stockTarget.current} وحدة</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">الكمية الجديدة</label>
                <input type="number" value={newStockValue} onChange={(e) => setNewStockValue(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-emerald-200 text-lg font-black text-gray-900 dark:text-white focus:outline-none transition-all text-center" />
              </div>
            </div>
            <div className="px-8 pb-8 flex gap-3">
              <button onClick={() => setShowStockModal(false)} className="flex-1 py-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest">إلغاء</button>
              <button onClick={updateStock} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">تحديث</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .dark .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #1f2937; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #84cc16; }
      `,
      }}
      />
    </div>
  );
};

export default memo(Products);