import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  FiSearch, FiDownload, FiUpload, FiPackage, FiAlertTriangle,
  FiDollarSign, FiBox,
  FiTrendingDown,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const ROWS_PER_PAGE = 10;

const InventoryRow = memo(({ item }) => {
  const isLow = item.stock <= (item.threshold || 0);
  const statusCls = isLow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-5 py-4 text-sm font-medium text-gray-800 text-center">{item.name || '-'}</td>
      <td className="px-5 py-4 text-center font-bold">{Number(item.price || 0).toLocaleString()} ج.م</td>
      <td className="px-5 py-4 text-center">{item.stock}</td>
      <td className="px-5 py-4 text-center">
        <span className={`px-4 py-2 rounded-full text-xs font-bold ${statusCls}`}>
          {isLow ? 'مخزون منخفض' : 'متوفر'}
        </span>
      </td>
    </tr>
  );
});

const SkeletonRow = memo(() => (
  <tr>
    {Array.from({ length: 4 }).map((_, i) => (
      <td key={i} className="px-5 py-4 text-center">
        <div className="h-4 bg-gray-200 rounded-full animate-pulse mx-auto w-32" />
      </td>
    ))}
  </tr>
));

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({ lowStock: 0, outOfStock: 0, totalValue: 0, totalItems: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const abortCtrl = useRef(new AbortController());
  const fileInputRef = useRef(null);

  const API_BASE = '/api/shop/inventory';


useEffect(() => {
document.title = "إدارة الجرد";

});

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
      
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchInventory();
    return () => abortCtrl.current.abort();
  }, [fetchInventory]);

  const filtered = useMemo(() =>
    inventory.filter(i =>
      [i.name, i.categoryName, i.sku].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [inventory, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filtered.slice(start, start + ROWS_PER_PAGE);
  }, [filtered, currentPage]);

  const showToast = (title, text, icon) => {
    Swal.fire({
      title, text, icon, toast: true, position: 'top-end',
      showConfirmButton: false, timer: 2500, timerProgressBar: true,
      background: icon === 'success' ? '#ecfdf5' : '#fee2e2',
      color: icon === 'success' ? '#166534' : '#991b1b',
    });
  };

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
      showToast('نجح', 'تم تصدير المخزون بنجاح', 'success');
    } catch {
      showToast('خطأ', 'فشل تصدير الملف', 'error');
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      showToast('خطأ', 'يرجى اختيار ملف CSV فقط', 'error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/shops/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchInventory();
      showToast('نجح', 'تم استيراد المخزون بنجاح', 'success');
    } catch (err) {
      showToast('خطأ', err.response?.data?.message || 'فشل الاستيراد', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div dir="rtl" style={{ marginTop: "-540px", marginLeft: "-250px" }} className="min-h-screen bg-gray-50 font-cairo py-8">
      <div className="max-w-5xl mx-auto px-6">

      
        <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between flex-row-reverse text-right gap-5">
            <div className="p-5 bg-lime-100 rounded-2xl">
              <FiPackage className="text-4xl text-lime-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">إدارة الجرد والمخزون</h1>
              <p className="text-lg text-gray-600 mt-2">تابع الكميات والأسعار وتنبيهات المخزون المنخفض بدقة عالية</p>
            </div>
          </div>
        </div>

        
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
 
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between flex-row-reverse">
      <div>
        <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalItems}</p>
      </div>
      <div className="p-3.5 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
        <FiBox className="w-8 h-8 text-gray-700" />
      </div>
    </div>
  </div>

 
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between flex-row-reverse">
      <div>
        <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
        <p className="text-3xl font-bold text-red-700 mt-2">{stats.lowStock}</p>
      </div>
      <div className="p-3.5 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
        <FiAlertTriangle className="w-8 h-8 text-red-600" />
      </div>
    </div>
  </div>

  
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between flex-row-reverse">
      <div>
        <p className="text-sm font-medium text-gray-600">نفد المخزون</p>
        <p className="text-3xl font-bold text-orange-700 mt-2">{stats.outOfStock}</p>
      </div>
      <div className="p-3.5 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
        <FiTrendingDown className="w-8 h-8 text-orange-600" />
      </div>
    </div>
  </div>


  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between gap-3 flex-row-reverse">
      <div>
        <p className="text-sm font-medium text-gray-600">قيمة المخزون</p>
        <p className="text-2xl font-bold text-emerald-700 mt-2">
          {Number(stats.totalValue).toLocaleString()} ج.م
        </p>
      </div>
      <div className="p-3.5 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
        <FiDollarSign className="w-8 h-8 text-emerald-600" />
      </div>
    </div>
  </div>
</div>

      
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
              <input
                type="text"
                placeholder="ابحث بالاسم، الكود، أو الفئة..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 py-3.5 pl-4 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-base transition bg-gray-50"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-6 py-3.5 bg-blue-500 hover:bg-blue-500 border border-blue-500 text-white hover:text-white rounded-3xl font-medium shadow transition flex items-center gap-2 disabled:opacity-70"
              >
                <FiUpload className="w-5 h-5" />
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
                className="px-6 py-3.5 bg-transparent hover:bg-teal-500 border border-teal-500 text-teal-500 hover:text-white rounded-3xl font-medium shadow transition flex items-center gap-2"
              >
                <FiDownload className="w-5 h-5" />
                تصدير CSV
              </button>
            </div>
          </div>
        </div>

       
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 border-6 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-6 text-lg text-gray-600">جاري تحميل المخزون...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              <FiPackage className="w-16 h-16 mx-auto opacity-30 mb-4" />
              <p className="text-xl">لا توجد منتجات في المخزون</p>
              <p className="mt-2">ابدأ باستيراد ملف CSV</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-5 py-4 text-base font-bold">المنتج</th>
                    <th className="px-5 py-4 text-base font-bold">السعر</th>
                    <th className="px-5 py-4 text-base font-bold">الكمية</th>
                    <th className="px-5 py-4 text-base font-bold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((item) => (
                    <InventoryRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

       
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
            >
              <FiChevronLeft className="w-5 h-5" />
              السابق
            </button>

            <div className="flex gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-12 h-12 rounded-xl font-bold text-base transition shadow-sm flex items-center justify-center ${
                    currentPage === i + 1 ? 'bg-lime-600 text-white' : 'bg-white border border-lime-600 text-lime-700 hover:bg-lime-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-3 bg-white border border-lime-600 rounded-xl disabled:opacity-50 hover:bg-lime-50 text-lime-700 font-medium transition shadow-sm flex items-center gap-2"
            >
              التالي
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;