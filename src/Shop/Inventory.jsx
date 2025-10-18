import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FiUpload, FiDownload, FiPlus, FiTrash2, FiEdit, FiSearch, FiInbox, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';
import api from '../api'; 
import debounce from 'lodash/debounce'; 

const API_BASE = '/api/shop/inventory'; 

const Inventory = ({ darkMode }) => {
  const [inventory, setInventory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState({
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    totalItems: 0,
  });
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
    supplier: '',
    sku: '',
    barcode: '',
    location: '',
    threshold: '',
  });
  const [showForm, setShowForm] = useState(false);

  const devicesPerPage = 5;

  // Debounced fetchInventory to limit API calls during search
  const debouncedFetchInventory = useMemo(
    () =>
      debounce(async (query) => {
        try {
          const res = await api.get(`${API_BASE}/search?query=${query}`);
          setInventory(res.data.content || []);
        } catch (err) {
          console.error('Error fetching inventory:', err.response?.data || err.message);
          Swal.fire('Error', 'Failed to fetch inventory', 'error');
        }
      }, 300),
    []
  );

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/api/shops/products');
      const products = Array.isArray(res.data) ? res.data : res.data.content || [];
      console.log('Products:', products);
      setProducts(products);
    } catch (err) {
      console.error('Error fetching products:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to fetch products', 'error');
    }
  }, []);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    debouncedFetchInventory(searchTerm);
  }, [searchTerm, debouncedFetchInventory]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const [lowStockRes, outOfStockRes, totalValueRes, totalItemsRes] = await Promise.all([
        api.get(`${API_BASE}/low-stock`),
        api.get(`${API_BASE}/out-of-stock`),
        api.get(`${API_BASE}/total-value`),
        api.get(`${API_BASE}/total-items`),
      ]);

      setStats({
        lowStock: Array.isArray(lowStockRes.data.content) ? lowStockRes.data.content.length : lowStockRes.data.content || 0,
        outOfStock: Array.isArray(outOfStockRes.data.content) ? outOfStockRes.data.content.length : outOfStockRes.data.content || 0,
        totalValue: Number(totalValueRes.data) || 0,
        totalItems: Number(totalItemsRes.data) || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to fetch stats', 'error');
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchInventory();
    fetchStats();
    fetchProducts();
  }, [fetchInventory, fetchStats, fetchProducts]);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedFetchInventory.cancel();
    };
  }, [debouncedFetchInventory]);

  // Filter products (memoized for performance)
  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  // Pagination logic
  const indexOfLastDevice = currentPage * devicesPerPage;
  const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
  const currentDevices = filteredProducts.slice(indexOfFirstDevice, indexOfLastDevice);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / devicesPerPage));

  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
        await api({
          method: editingId ? 'PUT' : 'POST',
          url,
          data: formData,
          headers: { 'Content-Type': 'application/json' },
        });
        await Promise.all([fetchInventory(), fetchStats()]);
        resetForm();
        Swal.fire('Success', editingId ? 'Product updated' : 'Product added', 'success');
      } catch (err) {
        console.error('Error saving item:', err.response?.data || err.message);
        Swal.fire('Error', 'Failed to save item', 'error');
      }
    },
    [editingId, formData, fetchInventory, fetchStats]
  );

  const handleEdit = useCallback((item) => {
    setFormData({
      ...item,
      price: item.price || '',
      quantity: item.quantity || '',
      threshold: item.threshold || '',
    });
    setEditingId(item.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      try {
        await api.delete(`${API_BASE}/${id}`);
        await Promise.all([fetchInventory(), fetchStats()]);
        Swal.fire('Success', 'Product deleted', 'success');
      } catch (err) {
        console.error('Error deleting item:', err.response?.data || err.message);
        Swal.fire('Error', 'Failed to delete item', 'error');
      }
    },
    [fetchInventory, fetchStats]
  );

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      name: '',
      category: '',
      price: '',
      quantity: '',
      supplier: '',
      sku: '',
      barcode: '',
      location: '',
      threshold: '',
    });
    setEditingId(null);
    setShowForm(false);
  }, []);

  const exportToExcel = useCallback(async () => {
    try {
      const res = await api.get(`${API_BASE}/export`, { responseType: 'blob' });
      saveAs(res.data, 'inventory.csv');
      Swal.fire('Success', 'File exported successfully', 'success');
    } catch (err) {
      console.error('Error exporting file:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to export file', 'error');
    }
  }, []);

  const importFromExcel = useCallback(async (e) => {
    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      await api.post(`${API_BASE}/import`, formDataUpload);
      await Promise.all([fetchInventory(), fetchStats()]);
      Swal.fire('Success', 'File imported successfully', 'success');
    } catch (err) {
      console.error('Error importing file:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to import file', 'error');
    }
  }, [fetchInventory, fetchStats]);

  return (
    <div style={{marginTop:"-600px",marginLeft:"250px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="bg-white flex justify-between items-center flex-wrap flex-row-reverse dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-3">
          <FiInbox className="text-xl sm:text-2xl" /> الجرد
        </h1>
        <div className="flex gap-2 flex-row-reverse flex-wrap">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="...ابحث في الجرد"
              className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            {/* <label className="flex items-center gap-2 px-4 py-2 font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all duration-300 shadow-md cursor-pointer">
              <FiUpload /> استيراد CSV
              <input type="file" accept=".csv" onChange={importFromExcel} className="hidden" />
            </label> */}
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 font-bold bg-white text-emerald-600 border-2 rounded-lg  dark:bg-gray-950 dark:text-white dark:border-gray-700 dark:hover:bg-emerald-600 transition-all duration-300 shadow-md"
            >
              <FiDownload /> تصدير CSV
            </button>
        
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-6xl mx-auto">
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-indigo-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">عدد المنتجات</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 text-right">{products.length}</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-red-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">منتجات المخزون المنخفض</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 text-right">{stats.lowStock}</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-amber-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">منتجات لايوجد مخزون لها</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400 text-right">{stats.outOfStock}</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 text-right">إجمالي قيمة المخزون</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 text-right">{Number(stats.totalValue).toLocaleString()} EGP</p>
        </div>
      </div>
      <br />
      <br />

      {/* <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row-reverse items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="...ابحث في الجرد"
              className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-all duration-300 shadow-md"
            >
              <FiDownload /> تصدير CSV
            </button>
        
          </div>
        </div>
      </div> */}

      {showForm && (
        <div className="max-w-6xl mx-auto mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-3">
              <FiInbox className="text-indigo-600 dark:text-indigo-400" />
              {editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
            >
              <FiX className="text-xl" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="اسم المنتج"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="text"
              name="category"
              placeholder="التصنيف"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="number"
              name="price"
              placeholder="أدخل السعر"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="number"
              name="quantity"
              placeholder="أدخل الكمية"
              value={formData.quantity}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="text"
              name="supplier"
              placeholder="المورد"
              value={formData.supplier}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="text"
              name="sku"
              placeholder="SKU"
              value={formData.sku}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="text"
              name="barcode"
              placeholder="الباركود"
              value={formData.barcode}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="text"
              name="location"
              placeholder="الموقع"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <input
              type="number"
              name="threshold"
              placeholder="الحد الأدنى للمخزون"
              value={formData.threshold}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
            <div className="sm:col-span-2 flex justify-end gap-4">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md"
              >
                {editingId ? 'تعديل المنتج' : 'إضافة المنتج'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 shadow-md"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-center text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">اسم المنتج</th>
                  <th className="px-4 py-3 font-semibold">التصنيف</th>
                  <th className="px-4 py-3 font-semibold">السعر</th>
                  <th className="px-4 py-3 font-semibold">الكمية</th>
                  <th className="px-4 py-3 font-semibold">حالة المنتج</th>
                  {/* <th className="px-4 py-3 font-semibold">الإجراءات</th> */}
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {currentDevices.length > 0 ? (
                  currentDevices.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <td className="px-4 py-3">{item.name || '-'}</td>
                      <td className="px-4 py-3">{item.categoryName || item.category || '-'}</td>
                      <td className="px-4 py-3">{Number(item.price || 0).toLocaleString()} EGP</td>
                      <td className="px-4 py-3">{item.stock}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.stock <= (item.threshold || 0)
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}
                        >
                          {item.stock <= (item.threshold || 0) ? 'مخزون منخفض' : 'متوفر'}
                        </span>
                      </td>
                      {/* <td className="px-4 py-3 flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                        >
                          <FiTrash2 />
                        </button>
                      </td> */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center">
                      <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        لا توجد منتجات
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm ? 'حاول تعديل مصطلحات البحث' : 'أضف منتجًا جديدًا لبدء إدارة المخزون'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 max-w-6xl mx-auto">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              <FiChevronLeft />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                  currentPage === i + 1
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;