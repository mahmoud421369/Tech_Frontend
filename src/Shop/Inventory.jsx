import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  FiSearch,
  FiDownload,
  FiUpload,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiAlertTriangle,
  FiDollarSign,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import debounce from 'lodash/debounce';
import api from '../api';

const API_BASE = '/api/shop/inventory';
const ROWS_PER_PAGE = 10;


const InventoryRow = memo(({ item }) => {
  const isLow = item.stock <= (item.threshold || 0);
  const statusCls = isLow
    ? 'bg-red-100 text-red-800'
    : 'bg-green-100 text-green-800';

  return (
    <tr className="border-b border-lime-100 hover:bg-lime-50 transition">
      <td className="px-4 py-3 text-sm font-medium text-black text-center">{item.name || '-'}</td>
      {/* <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.categoryName || item.category || '-'}</td> */}
      <td className="px-4 py-3 text-sm font-medium text-black text-center">
        {Number(item.price || 0).toLocaleString()} ج.م
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 text-center">{item.stock}</td>
      <td className="px-4 py-3 text-center">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusCls}`}>
          {isLow ? 'مخزون منخفض' : 'متوفر'}
        </span>
      </td>
    </tr>
  );
});
InventoryRow.displayName = 'InventoryRow';


const SkeletonRow = memo(() => (
  <tr>
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-4 py-3 text-center">
        <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-24" />
      </td>
    ))}
  </tr>
));
SkeletonRow.displayName = 'SkeletonRow';

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ lowStock: 0, outOfStock: 0, totalValue: 0, totalItems: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const abortCtrl = React.useRef(new AbortController());
  const fileInputRef = React.useRef(null);

  // -----------------------------------------------------------------
  // Fetch Data
  // -----------------------------------------------------------------
  const fetchInventory = useCallback(async () => {
    abortCtrl.current.abort();
    abortCtrl.current = new AbortController();
    setLoading(true);
    try {
      const [invRes, lowRes, outRes, valRes, itemsRes] = await Promise.all([
        api.get(`${API_BASE}/search?query=${searchTerm}`, { signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/low-stock`, { signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/out-of-stock`, { signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/total-value`, { signal: abortCtrl.current.signal }),
        api.get(`${API_BASE}/total-items`, { signal: abortCtrl.current.signal }),
      ]);

      const inv = Array.isArray(invRes.data.content) ? invRes.data.content : [];
      setInventory(inv);

      setStats({
        lowStock: lowRes.data.content?.length || 0,
        outOfStock: outRes.data.content?.length || 0,
        totalValue: Number(valRes.data) || 0,
        totalItems: Number(itemsRes.data) || 0,
      });
    } catch (err) {
      // if (err.name !== 'AbortError') {
      //   console.error(err);
      //   showToast('خطأ', 'فشل تحميل الجرد', 'error');
      // }
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  // -----------------------------------------------------------------
  // Debounced Search
  // -----------------------------------------------------------------
  const debouncedSearch = useMemo(
    () => debounce((val) => setSearchTerm(val), 300),
    []
  );

  const handleSearch = (e) => {
    const val = e.target.value;
    debouncedSearch(val);
    setCurrentPage(1);
  };

  // -----------------------------------------------------------------
  // Load on mount / search change
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchInventory();
    return () => abortCtrl.current.abort();
  }, [fetchInventory]);

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // -----------------------------------------------------------------
  // Filtering & Pagination
  // -----------------------------------------------------------------
  const filtered = useMemo(
    () =>
      inventory.filter((i) =>
        [i.name, i.categoryName, i.sku].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [inventory, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, currentPage]);

  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // -----------------------------------------------------------------
  // Toast Helper (Top-Right)
  // -----------------------------------------------------------------
  const showToast = (title, text, icon) => {
    Swal.fire({
      title,
      text,
      icon,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: icon === 'success' ? '#ecfdf5' : '#fee2e2',
      color: icon === 'success' ? '#166534' : '#991b1b',
      customClass: {
        popup: 'shadow-lg',
      },
    });
  };

  // -----------------------------------------------------------------
  // Export Excel (CSV)
  // -----------------------------------------------------------------
  const exportExcel = async () => {
    try {
      const res = await api.get(`${API_BASE}/export`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('نجح', 'تم التصدير', 'success');
    } catch (err) {
      showToast('خطأ', 'فشل التصدير', 'error');
    }
  };

  // -----------------------------------------------------------------
  // Import CSV – SAME COLUMNS AS TABLE
  // -----------------------------------------------------------------
  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showToast('خطأ', 'يرجى اختيار ملف CSV', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`api/shops/products/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchInventory();
      showToast('نجح', 'تم استيراد الملف بنجاح', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل استيراد الملف';
      showToast('خطأ', msg, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // -----------------------------------------------------------------
  // Open File Picker
  // -----------------------------------------------------------------
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div dir="rtl" style={{ marginTop: "-575px", marginLeft: "-25px" }} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto">

        
        <div className="mb-8 text-right bg-white p-6 shadow-md border-l-4  border-lime-500">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-lime-100 rounded-full">
                <FiPackage className="w-7 h-7 text-lime-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">الجرد</h1>
                <p className="text-sm text-gray-600">إدارة المخزون ومتابعة الكميات</p>
              </div>
            </div>
            <div className="flex gap-3">

             
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm disabled:opacity-60"
              >
                <FiUpload />
                {uploading ? 'جاري الرفع...' : 'استيراد CSV'}
              </button>

           
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />

              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition shadow-sm"
              >
                <FiDownload /> تصدير CSV
              </button>
            </div>
          </div>
        </div>

    
        <div className="mb-6 max-w-md">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" in />
            <input
              type="text"
              placeholder="ابحث في الجرد..."
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none transition text-right"
            />
          </div>
        </div>

       
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="p-5 bg-white shadow-md border-l-4 border-lime-500">
            <div className="flex items-center justify-start gap-3 mb-2">
              <FiPackage className="w-6 h-6 text-lime-600" />
              <h3 className="text-sm font-medium text-black">عدد المنتجات</h3>
            </div>
            <p className="text-2xl font-bold text-black">{stats.totalItems}</p>
          </div>

          <div className="p-5 bg-white shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-start gap-3 mb-2">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-sm font-medium text-black">مخزون منخفض</h3>
            </div>
            <p className="text-2xl font-bold text-black">{stats.lowStock}</p>
          </div>

          <div className="p-5 bg-white shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-start gap-3 mb-2">
              <FiAlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-sm font-medium text-black">نفد المخزون</h3>
            </div>
            <p className="text-2xl font-bold text-black">{stats.outOfStock}</p>
          </div>

          <div className="p-5 bg-white shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-start gap-3 mb-2">
              <FiDollarSign className="w-6 h-6 text-green-600" />
              <h3 className="text-sm font-medium text-black">قيمة المخزون</h3>
            </div>
            <p className="text-2xl font-bold text-black">{Number(stats.totalValue).toLocaleString()} ج.م</p>
          </div>
        </div>

      
        <div className="bg-white rounded-xl shadow-sm border ">
          {loading ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['المنتج',  'السعر', 'الكمية', 'الحالة'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-gray-700 text-center">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {['المنتج','السعر', 'الكمية', 'الحالة'].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-gray-700 text-center">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-lime-100">
                  {paginated.length ? (
                    paginated.map((item) => (
                      <InventoryRow key={item.id} item={item} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-gray-500">
                        <div className="text-lime-400 mb-4">
                          <FiPackage className="w-16 h-16 mx-auto opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">
                          لا توجد منتجات
                        </h3>
                        <p className="text-gray-600">
                          {searchTerm ? 'جرب تعديل البحث' : 'استورد بيانات من ملف CSV'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

    
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
            >
              <FiChevronRight />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => goToPage(i + 1)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  currentPage === i + 1
                    ? 'bg-lime-500 text-white border-lime-500'
                    : 'border-lime-200 hover:bg-lime-50 text-black'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
            >
              <FiChevronLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;