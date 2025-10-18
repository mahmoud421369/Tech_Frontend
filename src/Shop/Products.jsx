
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { FiBox, FiEdit3, FiInbox, FiSmartphone, FiTrash2, FiChevronRight, FiChevronLeft, FiSearch, FiChevronDown } from 'react-icons/fi';
import ShopLayout from '../components/ShopLayout';
import api from '../api'; // Import the Axios instance from api.js
import debounce from 'lodash/debounce'; // Import lodash debounce for search optimization

const Products = () => {
  const [products, setProducts] = useState([]);
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
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const productsPerPage = 10;

  const conditions = ['NEW', 'USED', 'REFURBISHED'];

  // Fetch products
  const fetchProducts = useCallback(async () => {
    const controller = new AbortController();
    try {
      const res = await api.get('/api/shops/products', {
        signal: controller.signal,
        params: { query: searchTerm }, // Support server-side search
      });
      const data = res.data;
      console.log(Array.isArray(data) ? data : data.content || [])
      setProducts(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching products:', err.response?.data || err.message);
        Swal.fire('Error', 'Failed to fetch products', 'error');
      }
    }
    return () => controller.abort();
  }, [searchTerm]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    const controller = new AbortController();
    try {
      const res = await api.get('/api/categories', {
        signal: controller.signal,
      });
      const data = res.data;
      setCategories(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching categories:', err.response?.data || err.message);
        Swal.fire('Error', 'Failed to fetch categories', 'error');
      }
    }
    return () => controller.abort();
  }, []);

  // Debounced search
  const debouncedFetchProducts = useMemo(
    () => debounce(fetchProducts, 300),
    [fetchProducts]
  );

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    return () => {
      debouncedFetchProducts.cancel();
    };
  }, [fetchProducts, fetchCategories, debouncedFetchProducts]);

  // Add product
  const addProduct = useCallback(async () => {
    try {
      if (!newProduct.category?.id) {
        Swal.fire('Error', 'Please select a category', 'error');
        return;
      }

      const productToSubmit = {
        ...newProduct,
        price: newProduct.price ? Number(newProduct.price) : 0,
        stockQuantity: newProduct.stockQuantity ? Number(newProduct.stockQuantity) : 0,
        category: { id: newProduct.category.id, name: newProduct.category.name },
      };

      await api.post('/api/shops/products', productToSubmit);
      Swal.fire('Success!', 'Product added successfully', 'success');
      setNewProduct({
        name: '',
        description: '',
        price: '',
        imageUrl: '',
        category: { id: '', name: '' },
        stockQuantity: '',
        condition: 'NEW',
      });
      fetchProducts();
    } catch (err) {
      console.error('Error adding product:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to add product', 'error');
    }
  }, [newProduct, fetchProducts]);

  // Update product
  const updateProduct = useCallback(async () => {
    try {
      if (!editingProduct.category?.id) {
        Swal.fire('Error', 'Please select a category', 'error');
        return;
      }

      const updateData = {
        ...editingProduct,
        price: editingProduct.price ? Number(editingProduct.price) : 0,
        stockQuantity: editingProduct.stockQuantity ? Number(editingProduct.stockQuantity) : 0,
        category: { id: editingProduct.category.id, name: editingProduct.category.name },
      };

      await api.put(`/api/shops/products/${editingProduct.id}`, updateData);
      Swal.fire('Success!', 'Product updated successfully', 'success');
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Error updating product:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to update product', 'error');
    }
  }, [editingProduct, fetchProducts]);

  // Update stock
  const updateStock = useCallback(async (productId, currentStock) => {
    const { value: newStock } = await Swal.fire({
      title: 'تحديث المخزون',
      input: 'number',
      inputLabel: 'الكمية المتاحة',
      inputValue: currentStock,
      inputAttributes: { min: '0', step: '1' },
      showCancelButton: true,
      confirmButtonText: 'تحديث',
      cancelButtonText: 'إلغاء',
    });

    if (newStock === undefined || newStock === null) return;

    try {
      await api.patch(`/api/shops/products/${productId}/stock`, { newStock: parseInt(newStock) });
      Swal.fire('Success!', 'تم تحديث المخزون بنجاح', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Error updating stock:', err.response?.data || err.message);
      Swal.fire('Error', 'فشل في تحديث المخزون', 'error');
    }
  }, [fetchProducts]);

  // Delete product
  const deleteProduct = useCallback(async (productId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/shops/products/${productId}`);
      Swal.fire('Deleted!', 'Product has been deleted.', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err.response?.data || err.message);
      Swal.fire('Error', 'Failed to delete product', 'error');
    }
  }, [fetchProducts]);

  // Pagination and filtering
  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const changePage = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  return (
    <ShopLayout>
      <div style={{marginTop:"-1200px",marginLeft:"250px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-3">
            <FiBox className="text-xl sm:text-2xl" /> المنتجات
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center justify-center gap-3">
            <FiSmartphone className="text-indigo-600 dark:text-indigo-400" />
            {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(editingProduct ? [editingProduct] : [newProduct]).map((product, idx) => (
              <React.Fragment key={idx}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="اسم المنتج"
                    value={product.name}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, name: e.target.value })
                        : setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    className="w-full pl-4 pr-10 py-3 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="وصف المنتج"
                    value={product.description}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, description: e.target.value })
                        : setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="السعر"
                    value={product.price}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, price: e.target.value })
                        : setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="رابط الصورة"
                    value={product.imageUrl}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                        : setNewProduct({ ...newProduct, imageUrl: e.target.value })
                    }
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsConditionDropdownOpen(!isConditionDropdownOpen)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 text-right"
                  >
                    <span>{product.condition === 'NEW' ? 'جديد' : product.condition === 'USED' ? 'مستعمل' : 'مجدّد'}</span>
                    <FiChevronDown className={`transition-transform duration-300 ${isConditionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isConditionDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {conditions.map((cond) => (
                        <button
                          key={cond}
                          onClick={() => {
                            editingProduct
                              ? setEditingProduct({ ...editingProduct, condition: cond })
                              : setNewProduct({ ...newProduct, condition: cond });
                            setIsConditionDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          {cond === 'NEW' ? 'جديد' : cond === 'USED' ? 'مستعمل' : 'مجدّد'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="الكمية"
                    value={product.stockQuantity}
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, stockQuantity: e.target.value })
                        : setNewProduct({ ...newProduct, stockQuantity: e.target.value })
                    }
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 placeholder:text-right dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300 text-right"
                  >
                    <span>{product.category?.name || 'اختر الفئة'}</span>
                    <FiChevronDown className={`transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCategoryDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            editingProduct
                              ? setEditingProduct({ ...editingProduct, category: cat })
                              : setNewProduct({ ...newProduct, category: cat });
                            setIsCategoryDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              onClick={editingProduct ? updateProduct : addProduct}
              className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md"
            >
              {editingProduct ? 'تعديل المنتج' : 'إضافة المنتج'}
            </button>
            {editingProduct && (
              <button
                onClick={() => setEditingProduct(null)}
                className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 shadow-md"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="... ابحث في المنتجات"
                className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3 text-center">
              قائمة المنتجات
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto text-center text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold">اسم المنتج</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">السعر</th>
                  <th className="px-4 py-3 font-semibold">التصنيف</th>

                  <th className="px-4 py-3 font-semibold">المخزون</th>
                  <th className="px-4 py-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {currentProducts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3">{p.condition}</td>
                    <td className="px-4 py-3">{p.price} EGP</td>
                    <td className="px-4 py-3">{p.categoryName}</td>

                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3 flex justify-center gap-2">
                      <button
                        onClick={() =>
                          setEditingProduct({
                            ...p,
                            price: p.price || '',
                            stockQuantity: p.stock || '',
                          })
                        }
                        className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        onClick={() => updateStock(p.id, p.stock)}
                        className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-200"
                      >
                        <FiInbox />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentProducts.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-gray-800">
              <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                لا توجد منتجات
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                أضف منتجًا جديدًا لبدء إدارة قائمة المنتجات الخاصة بك
              </p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => changePage(currentPage - 1)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === 1}
              >
                <FiChevronRight />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => changePage(i + 1)}
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
                onClick={() => changePage(currentPage + 1)}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={currentPage === totalPages}
              >
                <FiChevronLeft />
              </button>
            </div>
          )}
        </div>
      </div>
    </ShopLayout>
  );
};

export default Products;