import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  FiBox, FiEdit3, FiInbox, FiTrash2, FiChevronRight, FiChevronLeft,
  FiSearch, FiChevronDown, FiImage, FiX, FiPackage, FiAlertCircle,
  FiCheckCircle, FiTool
} from 'react-icons/fi';
import ShopLayout from '../components/ShopLayout';
import api from '../api';
import debounce from 'lodash/debounce';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', price: '', imageUrl: '',
    category: { id: '', name: '' }, stockQuantity: '', condition: 'NEW',
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStockValue, setNewStockValue] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [isAddConditionOpen, setIsAddConditionOpen] = useState(false);
  const [isEditConditionOpen, setIsEditConditionOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  const addConditionRef = useRef(null);
  const editConditionRef = useRef(null);
  const addCategoryRef = useRef(null);
  const editCategoryRef = useRef(null);
  const modalRef = useRef(null);

  const productsPerPage = 10;
  const conditions = ['NEW', 'USED', 'REFURBISHED'];
  const conditionTranslations = { NEW: 'جديد', USED: 'مستعمل', REFURBISHED: 'مجدّد' };

  
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const newCondition = products.filter(p => p.condition === 'NEW').length;
    const usedOrRefurb = total - newCondition;

    return { total, inStock, outOfStock, newCondition, usedOrRefurb };
  }, [products]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addConditionRef.current && !addConditionRef.current.contains(e.target)) setIsAddConditionOpen(false);
      if (editConditionRef.current && !editConditionRef.current.contains(e.target)) setIsEditConditionOpen(false);
      if (addCategoryRef.current && !addCategoryRef.current.contains(e.target)) setIsAddCategoryOpen(false);
      if (editCategoryRef.current && !editCategoryRef.current.contains(e.target)) setIsEditCategoryOpen(false);
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setShowEditModal(false);
        setShowStockModal(false);
        setShowAddModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/shops/products', { params: { query: searchTerm } });
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setProducts(data);
    } catch (err) {
      Swal.fire('خطأ', 'فشل في جلب المنتجات', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/api/categories');
      const data = Array.isArray(res.data) ? res.data : res.data.content || [];
      setCategories(data);
    } catch (err) {
      Swal.fire('خطأ', 'فشل في جلب الفئات', 'error');
    }
  }, []);

  const debouncedSearch = useMemo(() => debounce((term) => setSearchTerm(term), 400), []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    return () => debouncedSearch.cancel();
  }, [fetchProducts, fetchCategories, debouncedSearch]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term) ||
      (p.categoryName || '').toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const addProduct = async () => {
    if (!newProduct.category?.id) return Swal.fire('خطأ', 'يرجى اختيار فئة', 'error');
    try {
      const productToSubmit = {
        ...newProduct,
        price: Number(newProduct.price) || 0,
        stockQuantity: Number(newProduct.stockQuantity) || 0,
        category: { id: newProduct.category.id },
      };
      await api.post('/api/shops/products', productToSubmit);
      Swal.fire('نجاح', 'تم إضافة المنتج', 'success');
      setShowAddModal(false);
      setNewProduct({ name: '', description: '', price: '', imageUrl: '', category: { id: '', name: '' }, stockQuantity: '', condition: 'NEW' });
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل في الإضافة', 'error');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct({
      ...product,
      stockQuantity: product.stock,
      category: { id: product.categoryId, name: product.categoryName || '' }
    });
    setShowEditModal(true);
  };

  const updateProduct = async () => {
    if (!editingProduct.category?.id) return Swal.fire('خطأ', 'يرجى اختيار فئة', 'error');
    try {
      const updateData = {
        ...editingProduct,
        price: Number(editingProduct.price) || 0,
        stockQuantity: Number(editingProduct.stockQuantity) || 0,
        category: { id: editingProduct.category.id },
      };
      await api.put(`/api/shops/products/${editingProduct.id}`, updateData);
      Swal.fire('نجاح', 'تم تعديل المنتج', 'success');
      setShowEditModal(false);
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في التعديل', 'error');
    }
  };

  const openStockModal = (id, stock) => {
    setSelectedProductId(id);
    setNewStockValue(stock);
    setShowStockModal(true);
  };

  const updateStock = async () => {
    try {
      await api.patch(`/api/shops/products/${selectedProductId}/stock`, { newStock: parseInt(newStockValue) });
      Swal.fire('نجاح', 'تم تحديث المخزون', 'success');
      setShowStockModal(false);
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في تحديث المخزون', 'error');
    }
  };

  const deleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'تأكيد الحذف', text: 'هل تريد حذف المنتج؟', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'نعم', cancelButtonText: 'لا'
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/api/shops/products/${id}`);
      Swal.fire('تم الحذف', 'تم حذف المنتج بنجاح', 'success');
      fetchProducts();
    } catch (err) {
      Swal.fire('خطأ', 'فشل في الحذف', 'error');
    }
  };

  return (
    <ShopLayout>
      <div style={{marginTop:"-1225px",marginLeft:"-250px"}} className="min-h-screen bg-gray-50 font-cairo py-8">
        <div className="max-w-5xl mx-auto px-6">

       
          <div className="mb-10 bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between text-right gap-5">
              <div className="p-5 bg-lime-100 rounded-2xl">
                <FiBox className="text-4xl text-lime-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">المنتجات</h1>
                <p className="text-lg text-gray-600 mt-2">إدارة كاملة لمنتجات متجرك مع إضافة وتعديل سريع</p>
              </div>
            </div>
          </div>

         
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">إجمالي المنتجات</p>
                  <p className="text-4xl font-bold mt-3">{stats.total}</p>
                </div>
                <FiPackage className="text-6xl opacity-40" />
              </div>
            </div>

            {/* <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">متوفر في المخزون</p>
                  <p className="text-4xl font-bold mt-3 text-green-600">{stats.inStock}</p>
                </div>
                <FiCheckCircle className="text-6xl opacity-40 text-green-600" />
              </div>
            </div>

            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">نفد المخزون</p>
                  <p className="text-4xl font-bold mt-3 text-red-600">{stats.outOfStock}</p>
                </div>
                <FiAlertCircle className="text-6xl opacity-40 text-red-600" />
              </div>
            </div> */}

            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">جديد</p>
                  <p className="text-4xl font-bold mt-3">{stats.newCondition}</p>
                </div>
                <FiTool className="text-6xl opacity-40" />
              </div>
            </div>

            <div className="bg-white border text-gray-600 rounded-3xl shadow-lg p-8 transform hover:scale-105 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">مستعمل / مجدد</p>
                  <p className="text-4xl font-bold mt-3">{stats.usedOrRefurb}</p>
                </div>
                <FiBox className="text-6xl opacity-40" />
              </div>
            </div>
          </div>

        
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row-reverse gap-4 items-center justify-between">
              <div className="flex-1 relative max-w-md">
                <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
                <input
                  type="text"
                  placeholder="ابحث في المنتجات..."
                  className="w-full pr-12 py-3.5 pl-4 rounded-xl border border-gray-300 focus:border-lime-500 focus:ring-4 focus:ring-lime-100 outline-none text-base transition bg-gray-50"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-8 py-3.5 bg-transparent  text-teal-500 border border-teal-500 rounded-3xl font-semibold hover:bg-teal-500 hover:text-white shadow transition flex items-center gap-2"
              >
                <FiBox className="w-5 h-5" />
                إضافة منتج جديد
              </button>
            </div>
          </div>

          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 border-6 border-lime-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-6 text-lg text-gray-600">جاري تحميل المنتجات...</p>
              </div>
            ) : currentProducts.length === 0 ? (
              <div className="p-20 text-center text-gray-500">
                <FiBox className="w-16 h-16 mx-auto opacity-30 mb-4" />
                <p className="text-xl">لا توجد منتجات حالياً</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-5 py-4 text-base font-bold text-right">الاسم</th>
                      <th className="px-5 py-4 text-base font-bold">الصورة</th>
                      <th className="px-5 py-4 text-base font-bold">الحالة</th>
                      <th className="px-5 py-4 text-base font-bold">السعر</th>
                      <th className="px-5 py-4 text-base font-bold">الفئة</th>
                      <th className="px-5 py-4 text-base font-bold">المخزون</th>
                      <th className="px-5 py-4 text-base font-bold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-4 text-sm font-medium text-gray-800 text-right">{p.name}</td>
                        <td className="px-5 py-4 text-center">
                          {p.imageUrl ? (
                            <button onClick={() => setSelectedImage(p.imageUrl)} className="p-2 rounded-lg bg-lime-100 hover:bg-lime-200 transition">
                              <FiImage className="w-5 h-5 text-lime-700" />
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            p.condition === 'NEW' ? 'bg-green-100 text-green-700' :
                            p.condition === 'USED' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {conditionTranslations[p.condition]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold">{p.price} ج.م</td>
                        <td className="px-5 py-4 text-center text-sm text-gray-600">{p.categoryName || '—'}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`font-bold ${p.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => openEditModal(p)} className="px-3 py-2 flex gap-2 bg-transparent text-amber-500 border border-amber-500 rounded-3xl text-xs font-medium transition">
                              <FiEdit3 className="w-4 h-4 inline ml-1" /> تعديل
                            </button>
                            <button onClick={() => openStockModal(p.id, p.stock)} className="px-3 py-2  flex gap-2 bg-transparent text-lime-500 border border-lime-500 rounded-3xl text-xs font-medium transition">
                              <FiInbox className="w-4 h-4 inline ml-1" /> مخزون
                            </button>
                            <button onClick={() => deleteProduct(p.id)} className="px-3 py-2 bg-red-500 flex gap-2 bg-transparent text-red-500 border border-red-500 rounded-3xl text-xs font-medium transition">
                              <FiTrash2 className="w-4 h-4 inline ml-1" /> حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

 
          {totalPages > 1 && (
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
      </div>
    </ShopLayout>
  );
};

export default Products;