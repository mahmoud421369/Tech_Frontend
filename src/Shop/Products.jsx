import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  FiBox, FiEdit3, FiInbox, FiTrash2, FiChevronRight, FiChevronLeft,
  FiSearch, FiChevronDown, FiImage, FiArrowUp, FiArrowDown, FiX
} from 'react-icons/fi';
import ShopLayout from '../components/ShopLayout';
import api from '../api';
import debounce from 'lodash/debounce';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: { id: '', name: '' },
    stockQuantity: '',
    condition: 'NEW',
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [newStockValue, setNewStockValue] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Separate dropdown states
  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [isEditConditionOpen, setIsEditConditionOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'afari' });
  const [selectedImage, setSelectedImage] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  // Separate refs
  const addConditionRef = useRef(null);
  const editConditionRef = useRef(null);
  const addCategoryRef = useRef(null);
  const editCategoryRef = useRef(null);
  const modalRef = useRef(null);

  const productsPerPage = 10;
  const conditions = ['NEW', 'USED', 'REFURBISHED'];

  const conditionTranslations = {
    NEW: 'جديد',
    USED: 'مستعمل',
    REFURBISHED: 'مجدّد',
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addConditionRef.current && !addConditionRef.current.contains(e.target)) setIsAddConditionOpen(false);
      if (editConditionRef.current && !editConditionRef.current.contains(e.target)) setIsEditConditionOpen(false);
      if (addCategoryRef.current && !addCategoryRef.current.contains(e.target)) setIsAddCategoryOpen(false);
      if (editCategoryRef.current && !editCategoryRef.current.contains(e.target)) setIsEditCategoryOpen(false);
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowEditModal(false);
        setShowStockModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const controller = new AbortController();
    try {
      const res = await api.get('/api/shops/products', {
        signal: controller.signal,
        params: { query: searchTerm },
      });
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setProducts(data);
      setFilteredProducts(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching products:', err);
        Swal.fire('خطأ', 'فشل في جلب المنتجات', 'error');
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [searchTerm]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    const controller = new AbortController();
    try {
      const res = await api.get('/api/categories', { signal: controller.signal });
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setCategories(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching categories:', err);
        Swal.fire('خطأ', 'فشل في جلب الفئات', 'error');
      }
    }
    return () => controller.abort();
  }, []);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, 400),
    []
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    return () => {
      debouncedSearch.cancel();
    };
  }, [fetchProducts, fetchCategories, debouncedSearch]);

  // Sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProducts = useMemo(() => {
    let sortable = [...filteredProducts];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'price' || sortConfig.key === 'stock') {
          aVal = Number(aVal);
          bVal = Number(bVal);
        } else if (sortConfig.key === 'name') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        } else if (sortConfig.key === 'condition') {
          aVal = conditions.indexOf(aVal);
          bVal = conditions.indexOf(bVal);
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredProducts, sortConfig]);

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Add product
  const addProduct = useCallback(async () => {
    if (!newProduct.category?.id) {
      Swal.fire('خطأ', 'يرجى اختيار فئة', 'error');
      return;
    }

    try {
      const productToSubmit = {
        ...newProduct,
        price: Number(newProduct.price) || 0,
        stockQuantity: Number(newProduct.stockQuantity) || 0,
        category: { id: newProduct.category.id },
      };

      await api.post('/api/shops/products', productToSubmit);
      Swal.fire({ title: 'نجاح', text: 'تم إضافة المنتج بنجاح', icon: 'success', confirmButtonColor: '#84cc16' });
      setNewProduct({
        name: '', description: '', price: '', imageUrl: '',
        category: { id: '', name: '' }, stockQuantity: '', condition: 'NEW'
      });
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل في إضافة المنتج', 'error');
    }
  }, [newProduct, fetchProducts]);

  // Open Edit Modal
  const openEditModal = (product) => {
    setEditingProduct({ ...product, stockQuantity: product.stock });
    setShowEditModal(true);
    setOpenMenu(null);
  };

  // Update product
  const updateProduct = useCallback(async () => {
    if (!editingProduct.category?.id) {
      Swal.fire('خطأ', 'يرجى اختيار فئة', 'error');
      return;
    }

    try {
      const updateData = {
        ...editingProduct,
        price: Number(editingProduct.price) || 0,
        stockQuantity: Number(editingProduct.stockQuantity) || 0,
        category: { id: editingProduct.category.id },
      };

      await api.put(`/api/shops/products/${editingProduct.id}`, updateData);
      Swal.fire({ title: 'نجاح', text: 'تم تعديل المنتج بنجاح', icon: 'success', confirmButtonColor: '#84cc16' });
      setShowEditModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل في تعديل المنتج', 'error');
    }
  }, [editingProduct, fetchProducts]);

  // Open Stock Modal
  const openStockModal = (productId, currentStock) => {
    setSelectedProductId(productId);
    setNewStockValue(currentStock);
    setShowStockModal(true);
    setOpenMenu(null);
  };

  // Update stock
  const updateStock = useCallback(async () => {
    if (!selectedProductId || newStockValue === '') return;

    try {
      await api.patch(`/api/shops/products/${selectedProductId}/stock`, { newStock: parseInt(newStockValue) });
      Swal.fire({ title: 'نجاح', text: 'تم تحديث المخزون', icon: 'success', confirmButtonColor: '#84cc16' });
      setShowStockModal(false);
      setSelectedProductId(null);
      setNewStockValue('');
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في تحديث المخزون', 'error');
    }
  }, [selectedProductId, newStockValue, fetchProducts]);

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف',
      text: 'هل أنت متأكد من حذف هذا المنتج؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#ef4444',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/shops/products/${productId}`);
      Swal.fire({ title: 'تم الحذف', text: 'تم حذف المنتج بنجاح', icon: 'success', confirmButtonColor: '#84cc16' });
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في حذف المنتج', 'error');
    }
  }, [fetchProducts]);

  return (
    <ShopLayout>
      <div style={{ marginLeft: "-25px", marginTop: "-1225px" }} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-white">
        {/* Header */}
        <div className="mb-8 text-right bg-white p-6 shadow-md border-l-4 border-lime-500">
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center justify-end gap-3">
            <FiBox className="text-gray-500" /> المنتجات
          </h1>
          <p className="text-sm text-gray-600">إدارة كاملة لمنتجات متجرك</p>
        </div>

        {/* Add Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-lime-100">
          <h2 className="text-xl font-bold text-black mb-6 flex items-center justify-end gap-2">
            <FiBox className="text-gray-500" /> إضافة منتج جديد
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {['name', 'description', 'price', 'imageUrl', 'stockQuantity'].map((field) => {
              const label = {
                name: 'اسم المنتج',
                description: 'وصف المنتج',
                price: 'السعر (ج.م)',
                imageUrl: 'رابط الصورة',
                stockQuantity: 'الكمية في المخزون'
              }[field];

              return (
                <div key={field} className="relative">
                  <input
                    type="text"
                    value={newProduct[field]}
                    onChange={(e) => setNewProduct({ ...newProduct, [field]: e.target.value })}
                    className="peer w-full px-4 py-3 pt-6 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none transition text-right text-black placeholder-gray-500"
                    placeholder=" "
                  />
                  <label className="absolute right-4 top-1 text-sm text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-lime-600">
                    {label}
                  </label>
                </div>
              );
            })}

            {/* Add: Condition Dropdown */}
            <div className="relative" ref={addConditionRef}>
              <button
                onClick={() => setIsAddConditionOpen(!isAddConditionOpen)}
                className="w-full px-4 py-3 bg-gray-50 border rounded-lg flex justify-between flex-row-reverse text-gray-500 items-center text-right text-black text-sm font-medium focus:ring-2 focus:ring-lime-400 focus:border-lime-500"
              >
                <span>{conditionTranslations[newProduct.condition] || 'اختر الحالة'}</span>
                <FiChevronDown className={`transition-transform ${isAddConditionOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAddConditionOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-lime-200 rounded-lg shadow-xl">
                  {conditions.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => {
                        setNewProduct({ ...newProduct, condition: cond });
                        setIsAddConditionOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm font-medium text-black"
                    >
                      {conditionTranslations[cond]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add: Category Dropdown */}
            <div className="relative" ref={addCategoryRef}>
              <button
                onClick={() => setIsAddCategoryOpen(!isAddCategoryOpen)}
                className="w-full px-4 py-3 bg-gray-50 border rounded-lg flex justify-between flex-row-reverse text-gray-500 items-center text-right text-black text-sm font-medium focus:ring-2 focus:ring-lime-400 focus:border-lime-500"
              >
                <span className=" font-medium">{newProduct.category?.name || 'اختر الفئة'}</span>
                <FiChevronDown className={`transition-transform ${isAddCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAddCategoryOpen && (
                <div className="absolute z-20 mt-2 w-full bg-white border border-lime-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setNewProduct({ ...newProduct, category: cat });
                        setIsAddCategoryOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm font-medium text-black"
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={addProduct}
              className="px-6 py-2.5 bg-lime-500 text-white font-bold rounded-lg hover:bg-lime-600 transition shadow-sm"
            >
              إضافة المنتج
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm p-6 border ">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في المنتجات..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none text-right"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>
            <h2 className="text-xl font-bold text-black">قائمة المنتجات</h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 border-b border-lime-100">
                  <div className="h-4 bg-lime-100 rounded w-1/3"></div>
                  <div className="h-4 bg-lime-100 rounded w-1/5"></div>
                  <div className="h-4 bg-lime-100 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-lime-400 mb-4">
                <FiBox className="w-20 h-20 mx-auto opacity-30" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">لا توجد منتجات</h3>
              <p className="text-gray-600">ابدأ بإضافة منتج جديد</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-lime-400 scrollbar-track-lime-50">
                <table className="w-full text-sm text-center">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-bold cursor-pointer hover:bg-lime-100 transition" onClick={() => handleSort('name')}>
                        <div className="flex items-center justify-end gap-1 text-gray-700">
                          الاسم
                          {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-gray-700">الصورة</th>
                      <th className="px-4 py-3 font-bold cursor-pointer hover:bg-lime-100 transition" onClick={() => handleSort('condition')}>
                        <div className="flex items-center justify-end gap-1 text-gray-700">
                          الحالة
                          {sortConfig.key === 'condition' && (sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                        </div>
                      </th>
                      <th className="px-4 py-3 font-bold cursor-pointer hover:bg-lime-100 transition" onClick={() => handleSort('price')}>
                        <div className="flex items-center justify-end gap-1 text-gray-700">
                          السعر
                          {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-gray-700">الفئة</th>
                      <th className="px-4 py-3 font-bold cursor-pointer hover:bg-lime-100 transition" onClick={() => handleSort('stock')}>
                        <div className="flex items-center justify-end gap-1 text-gray-700">
                          المخزون
                          {sortConfig.key === 'stock' && (sortConfig.direction === 'asc' ? <FiArrowUp /> : <FiArrowDown />)}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-gray-700">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lime-100">
                    {currentProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-lime-50 transition">
                        <td className="px-4 py-4 font-medium text-black">{p.name}</td>
                        <td className="px-4 py-4">
                          {p.imageUrl ? (
                            <button
                              onClick={() => setSelectedImage(p.imageUrl)}
                              className="p-1 rounded-lg bg-lime-100 hover:bg-lime-200 transition"
                            >
                              <FiImage className="w-5 h-5 text-lime-700" />
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">لا توجد صورة</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.condition === 'NEW' ? 'bg-green-100 text-green-700' :
                            p.condition === 'USED' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {conditionTranslations[p.condition]}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-black">{p.price} ج.م</td>
                        <td className="px-4 py-4 text-gray-600">{p.categoryName || 'غير محدد'}</td>
                        <td className="px-4 py-4">
                          <span className={`font-bold ${p.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {p.stock}
                          </span>
                        </td>

                        {/* Actions: Icon + Text (Small, Horizontal) */}
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEditModal(p)}
                              className="flex items-center gap-1 text-amber-700 hover:text-amber-800 bg-amber-100 rounded-lg px-2 py-1 transition text-xs"
                            >
                              <FiEdit3 className="w-4 h-4" />
                              <span>تعديل</span>
                            </button>

                            <button
                              onClick={() => openStockModal(p.id, p.stock)}
                              className="flex items-center gap-1 text-lime-700 hover:text-lime-800 bg-lime-100 rounded-lg px-2 py-1 transition text-xs"
                            >
                              <FiInbox className="w-4 h-4" />
                              <span>المخزون</span>
                            </button>

                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="flex items-center gap-1 text-red-700 hover:text-red-800 bg-red-100 rounded-lg px-2 py-1 transition text-xs"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => changePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
                  >
                    <FiChevronRight />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => changePage(i + 1)}
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
                    onClick={() => changePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-lime-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-50 transition"
                  >
                    <FiChevronLeft />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="flex justify-between flex-row-reverse items-center mb-6">
                <h3 className="text-xl font-bold text-black">تعديل المنتج</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {['name', 'description', 'price', 'imageUrl', 'stockQuantity'].map((field) => {
                  const label = {
                    name: 'اسم المنتج',
                    description: 'وصف المنتج',
                    price: 'السعر (ج.م)',
                    imageUrl: 'رابط الصورة',
                    stockQuantity: 'الكمية في المخزون'
                  }[field];

                  return (
                    <div key={field} className="relative">
                      <input
                        type="text"
                        value={editingProduct[field] || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, [field]: e.target.value })}
                        className="peer w-full px-4 py-3 pt-6 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none transition text-right text-black placeholder-gray-500"
                        placeholder=" "
                      />
                      <label className="absolute right-4 top-1 text-sm text-gray-500 transition-all duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-sm peer-focus:text-lime-600">
                        {label}
                      </label>
                    </div>
                  );
                })}

                {/* Edit: Condition Dropdown */}
                <div className="relative" ref={editConditionRef}>
                  <button
                    onClick={() => setIsEditConditionOpen(!isEditConditionOpen)}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-lg flex justify-between items-center text-right text-black text-sm font-medium focus:ring-2 focus:ring-lime-400 focus:border-lime-500"
                  >
                    <span>{conditionTranslations[editingProduct.condition] || 'اختر الحالة'}</span>
                    <FiChevronDown className={`transition-transform ${isEditConditionOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEditConditionOpen && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-lime-200 rounded-lg shadow-xl">
                      {conditions.map((cond) => (
                        <button
                          key={cond}
                          onClick={() => {
                            setEditingProduct({ ...editingProduct, condition: cond });
                            setIsEditConditionOpen(false);
                          }}
                          className="w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm font-medium text-black"
                        >
                          {conditionTranslations[cond]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit: Category Dropdown */}
                <div className="relative" ref={editCategoryRef}>
                  <button
                    onClick={() => setIsEditCategoryOpen(!isEditCategoryOpen)}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-lg flex justify-between items-center text-right text-black text-sm font-medium focus:ring-2 focus:ring-lime-400 focus:border-lime-500"
                  >
                    <span>{editingProduct.category?.name || 'اختر الفئة'}</span>
                    <FiChevronDown className={`transition-transform ${isEditCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isEditCategoryOpen && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-lime-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setEditingProduct({ ...editingProduct, category: cat });
                            setIsEditCategoryOpen(false);
                          }}
                          className="w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm font-medium text-black"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={updateProduct}
                  className="px-6 py-2.5 bg-lime-500 text-white font-bold rounded-lg hover:bg-lime-600 transition shadow-sm"
                >
                  حفظ التعديلات
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Modal */}
        {showStockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div ref={modalRef} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex justify-between flex-row-reverse items-center mb-6">
                <h3 className="text-xl font-bold text-black">تحديث المخزون</h3>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">الكمية الجديدة</label>
                <input
                  type="number"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 text-right border rounded-lg bg-gray-50 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={updateStock}
                  className="px-6 py-2.5 bg-lime-500 text-white font-bold rounded-lg hover:bg-lime-600 transition shadow-sm"
                >
                  تحديث
                </button>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {selectedImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-2xl w-full">
              <img
                src={selectedImage}
                alt="Product"
                className="w-full h-auto rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
};

export default Products;