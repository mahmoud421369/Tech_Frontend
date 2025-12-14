import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBox,
  FiEdit3,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiSearch,
  FiXCircle,
  FiChevronDown,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProductsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="h-10 w-48 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
        <div className="h-10 w-full sm:w-80 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Name', 'Price', 'Condition', 'Stock', 'Actions'].map((_, idx) => (
              <th key={idx} className="px-6 py-3">
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PaginatedTable = ({
  data,
  columns,
  page,
  setPage,
  pageSize,
  renderRow,
  emptyMessage,
  darkMode,
}) => {
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
      if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    }
    return pages;
  };

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: ${darkMode ? '#34d399' : '#10b981'}; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${darkMode ? '#6ee7b7' : '#059669'}; }
        `}
      </style>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
            {paginatedData.length > 0 ? (
              paginatedData.map(renderRow)
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <FiBox className="text-4xl text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              Prev <FiChevronLeft />
            </button>
            {getPageNumbers().map((num, i) => (
              <button
                key={i}
                onClick={() => typeof num === 'number' && setPage(num)}
                disabled={num === '...'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  num === '...'
                    ? 'cursor-default text-gray-500 dark:text-gray-400'
                    : page === num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const ProductsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);

 
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [conditionDropdownOpen, setConditionDropdownOpen] = useState(false);

  const filterRef = useRef(null);
  const categoryRef = useRef(null);
  const conditionRef = useRef(null);

  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryName: '',
    stockQuantity: '',
    condition: '',
  });

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setFilterDropdownOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setCategoryDropdownOpen(false);
      if (conditionRef.current && !conditionRef.current.contains(event.target)) setConditionDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setLoadingProducts(true);
    try {
      const { data } = await api.get('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setProducts(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load products.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [token, navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await api.get('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setCategories(processed);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load categories.', icon: 'error' });
    }
  }, [token]);

  const updateProduct = useCallback(async (product) => {
    await fetchCategories();
    setProductForm({
      id: product.id || '',
      name: product.name || '',
      description: product.description || '',
      price: product.price || '',
      imageUrl: product.imageUrl || '',
      categoryName: product.category?.name || '',
      stockQuantity: product.stock || '',
      condition: product.condition || '',
    });
    setIsProductModalOpen(true);
  }, [fetchCategories]);

  const handleProductUpdate = async (e) => {
    e.preventDefault();
    if (
      !productForm.name.trim() ||
      !productForm.description.trim() ||
      !productForm.price || isNaN(productForm.price) ||
      !productForm.categoryName ||
      !productForm.stockQuantity || isNaN(productForm.stockQuantity)
    ) {
      Swal.fire({ title: 'Error', text: 'Please fill all required fields correctly.', icon: 'error' });
      return;
    }

    try {
      await api.put(
        `/api/admin/products/${productForm.id}`,
        {
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          imageUrl: productForm.imageUrl || null,
          categoryName: productForm.categoryName,
          stockQuantity: Number(productForm.stockQuantity),
          condition: productForm.condition,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ title: 'Success', text: 'Product updated successfully!', icon: 'success', toast: true, position: 'top-end', timer: 2000 });
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to update product.', icon: 'error' });
    }
  };

  const deleteProduct = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire({ title: 'Deleted!', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchProducts();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to delete product.', icon: 'error' });
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(
      () => Swal.fire({ title: 'Copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Failed to copy', icon: 'error', toast: true })
    );
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (search.trim()) {
      const term = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
      );
    }

    if (filter === 'inStock') filtered = filtered.filter(p => p.stock > 0);
    if (filter === 'outOfStock') filtered = filtered.filter(p => p.stock === 0);

    return filtered;
  }, [products, search, filter]);

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    return { totalProducts: total, inStockProducts: inStock, outOfStockProducts: outOfStock };
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto space-y-8">

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiBox className="w-8 h-8" /> Products Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor, edit, and delete shop products</p>
        </div>

        {loadingProducts ? (
          <ProductsSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

        
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 border-b border-gray-200 dark:border-gray-700">
              {[
                { label: 'Total Products', value: stats.totalProducts },
                { label: 'In Stock', value: stats.inStockProducts },
                { label: 'Out of Stock', value: stats.outOfStockProducts },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

           
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col lg:flex-row gap-6 items-end">

             
                <div ref={filterRef} className="relative w-full sm:w-64">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Stock</label>
                  <button
                    type="button"
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-between text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <span>
                      {filter === 'all' && 'All Products'}
                      {filter === 'inStock' && 'In Stock'}
                      {filter === 'outOfStock' && 'Out of Stock'}
                    </span>
                    <FiChevronDown className={`w-5 h-5 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {filterDropdownOpen && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl">
                      {[
                        { value: 'all', label: 'All Products' },
                        { value: 'inStock', label: 'In Stock' },
                        { value: 'outOfStock', label: 'Out of Stock' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setFilter(option.value);
                            setPage(1);
                            setFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            filter === option.value
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

             
                <div className="flex-1 relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Products</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search by name or description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition"
                      >
                        <FiXCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            
            <div className="p-6">
              <PaginatedTable
                data={filteredProducts}
                columns={['ID', 'Name', 'Price', 'Condition', 'Stock', 'Actions']}
                page={page}
                setPage={setPage}
                pageSize={5}
                darkMode={darkMode}
                renderRow={(p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="truncate max-w-32">{p.id}</span>
                        <button onClick={() => copyToClipboard(p.id)} className="text-gray-500 hover:text-emerald-600">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" title={p.name}>
                      {DOMPurify.sanitize(p.name || 'N/A')}
                    </td>
                    <td className="px-6 py-4 text-sm">{p.price ? `${p.price} EGP` : 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(p.condition || 'N/A')}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        p.stock > 0
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {p.stock || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => updateProduct(p)}
                          className="px-3 py-1.5 text-xs bg-emerald-50 border border-gray-200 font-semibold dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="px-3 py-1.5 text-xs bg-red-50 border border-gray-200 font-semibold dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage="No products found"
              />
            </div>
          </div>
        )}

       
        {isProductModalOpen && (
          <Modal onClose={() => setIsProductModalOpen(false)} title="Update Product" darkMode={darkMode}>
            <form onSubmit={handleProductUpdate} className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Product Information</h4>
                  <button type="button" onClick={() => copyToClipboard(productForm.id)} className="text-gray-500 hover:text-emerald-600">
                    <FiCopy className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (EGP) *</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div ref={categoryRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 transition"
                    >
                      <span className={productForm.categoryName ? '' : 'text-gray-500'}>
                        {productForm.categoryName || 'Select category'}
                      </span>
                      <FiChevronDown className={`w-5 h-5 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {categoryDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {categories.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">No categories found</div>
                        ) : (
                          categories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setProductForm({ ...productForm, categoryName: cat.name });
                                setCategoryDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 transition"
                            >
                              {cat.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div ref={conditionRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition *</label>
                    <button
                      type="button"
                      onClick={() => setConditionDropdownOpen(!conditionDropdownOpen)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500 transition"
                    >
                      <span className={productForm.condition ? '' : 'text-gray-500'}>
                        {productForm.condition || 'Select condition'}
                      </span>
                      <FiChevronDown className={`w-5 h-5 transition-transform ${conditionDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {conditionDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl">
                        {['NEW', 'USED', 'REFURBISHED'].map((cond) => (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => {
                              setProductForm({ ...productForm, condition: cond });
                              setConditionDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 transition"
                          >
                            {cond}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                      rows="4"
                      placeholder="Describe the product..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-md"
                >
                  Update Product
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;