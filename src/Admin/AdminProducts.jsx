
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBox, FiEdit3, FiTrash2, FiChevronLeft, FiChevronRight, FiCopy, FiSearch, FiChevronDown, FiXCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProductsSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800">
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {['ID', 'Name', 'Price', 'Condition', 'Stock', 'Actions'].map((header, idx) => (
              <th key={idx} className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PaginatedTable = ({ data, columns, page, setPage, pageSize, renderRow, emptyMessage, darkMode }) => {
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-900 dark:text-gray-100">
          {paginatedData.map(renderRow)}
          {paginatedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <FiBox className="text-2xl text-gray-500 dark:text-gray-400" />
                  {emptyMessage}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
          >
            <FiChevronLeft /> 
          </button>
          {getPageNumbers().map((pageNum, idx) => (
            <button
              key={idx}
              onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                pageNum === '...' ? 'cursor-default' : page === pageNum ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
              }`}
              disabled={pageNum === '...'}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
          >
             <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

const ProductSection = ({ products, updateProduct, deleteProduct, darkMode }) => {
  const [productPage, setProductPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setSearch(value);
      setProductPage(1);
    }, 300),
    [setSearch]
  );

  const computedStats = useMemo(() => {
    const productsArray = Array.isArray(products) ? products : [];
    const totalProducts = productsArray.length;
    const inStockProducts = productsArray.filter((p) => p.stock > 0).length;
    const outOfStockProducts = productsArray.filter((p) => p.stock === 0).length;
    return { totalProducts, inStockProducts, outOfStockProducts };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const productsArray = Array.isArray(products) ? products : [];
    return productsArray.filter(
      (product) =>
        (product.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          product.description?.toLowerCase().includes(debouncedSearch.toLowerCase())) &&
        (filter === 'all' || 
         (filter === 'inStock' && product.stock > 0) || 
         (filter === 'outOfStock' && product.stock === 0))
    );
  }, [products, debouncedSearch, filter]);

  const copyToClipboard = useCallback(
    (id) => {
      navigator.clipboard.writeText(id).then(
        () => {
          Swal.fire({
            title: 'Success',
            text: 'Product ID copied to clipboard!',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          });
        },
        (err) => {
          console.error('Copy failed:', err);
          Swal.fire({
            title: 'Error',
            text: 'Failed to copy Product ID',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          });
        }
      );
    },
    [darkMode]
  );

  const filterOptions = [
    { value: 'all', label: 'All Products' },
    { value: 'inStock', label: 'In Stock' },
    { value: 'outOfStock', label: 'Out of Stock' },
  ];

  return (
    <section className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { title: 'Total Products', value: computedStats.totalProducts, color: 'indigo' },
          { title: 'In Stock', value: computedStats.inStockProducts, color: 'green' },
          { title: 'Out of Stock', value: computedStats.outOfStockProducts, color: 'red' },
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl`}
          >
            <h3 className={`text-sm font-semibold text-${stat.color}-600 dark:text-${stat.color}-400 uppercase tracking-wide`}>{stat.title}</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        {/* <div className="w-full sm:w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Products</label>
          <div className="relative">
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-left flex items-center justify-between focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
            >
              <span>{filterOptions.find((opt) => opt.value === filter)?.label || 'All Products'}</span>
              <FiChevronDown className={`transform transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isFilterDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilter(option.value);
                      setProductPage(1);
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div> */}
        <div className="w-full sm:w-80 relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Products</label>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleSearchChange(e.target.value);
              }}
              className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  handleSearchChange('');
                  setProductPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiXCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <PaginatedTable
        data={filteredProducts}
        columns={['ID', 'Name', 'Price', 'Condition', 'Stock', 'Actions']}
        page={productPage}
        setPage={setProductPage}
        pageSize={5}
        darkMode={darkMode}
        renderRow={(p) => (
          <tr
            key={p.id}
            className="text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-300"
          >
            <td className="px-6 py-4 text-sm font-medium flex items-center justify-center gap-2">
              <span className="truncate max-w-[150px]">{p.id}</span>
              <button
                onClick={() => copyToClipboard(p.id)}
                className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Copy Product ID"
              >
                <FiCopy size={16} />
                <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  Copy Product ID
                </span>
              </button>
            </td>
            <td className="px-6 py-4 text-sm font-medium">{DOMPurify.sanitize(p.name) || 'N/A'}</td>
            <td className="px-6 py-4 text-sm">{p.price ? `${p.price} EGP` : 'N/A'}</td>
            <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(p.condition) || 'N/A'}</td>
            <td className="px-6 py-4 text-sm">{p.stock ? `${p.stock} items` : '0 items'}</td>
            <td className="px-6 py-4 flex justify-center gap-2">
              <button
                onClick={() => updateProduct(p)}
                className="p-2 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800/70 transition-all duration-300"
                title="Edit Product"
              >
                <FiEdit3 size={16} />
              </button>
              <button
                onClick={() => deleteProduct(p.id)}
                className="p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800/70 transition-all duration-300"
                title="Delete Product"
              >
                <FiTrash2 size={16} />
              </button>
            </td>
          </tr>
        )}
        emptyMessage="No products found"
      />
    </section>
  );
};

const ProductsPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
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
  const [categories, setCategories] = useState([]);
 const copyToClipboard = useCallback(
    (id) => {
      navigator.clipboard.writeText(id).then(
        () => {
          Swal.fire({
            title: 'Success',
            text: 'Repair ID copied to clipboard!',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          });
        },
        (err) => {
          console.error('Copy failed:', err);
          Swal.fire({
            title: 'Error',
            text: 'Failed to copy Repair ID',
            icon: 'error',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500,
            customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
          });
        }
      );
    },
    [darkMode]
  );
  const fetchProducts = useCallback(async () => {
    if (!token) {
      Swal.fire({
        title: 'Error',
        text: 'No authentication token found. Please log in.',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      navigate('/login');
      return;
    }
    setLoadingProducts(true);
    const controller = new AbortController();
    try {
      const response = await api.get('/api/admin/products', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = response.data;
      if (response.data && response.data.content) {
        data = response.data.content;
      }
      data = Array.isArray(data) ? data : [];
      console.log('Processed Product Data:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to fetch products',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
    return () => controller.abort();
  }, [token, navigate, darkMode]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = response.data;
      if (response.data && response.data.content) {
        data = response.data.content;
      }
      data = Array.isArray(data) ? data : [];
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: 'Failed to fetch categories',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    }
  }, [token, darkMode]);

  const updateProduct = useCallback(
    async (product) => {
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
    },
    [fetchCategories]
  );

  const handleProductUpdate = useCallback(
    async (e) => {
      e.preventDefault();
      if (
        !productForm.name.trim() ||
        !productForm.description.trim() ||
        isNaN(productForm.price) ||
        !productForm.categoryName ||
        isNaN(productForm.stockQuantity)
      ) {
        Swal.fire({
          title: 'Error',
          text: 'All fields are required',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        return;
      }
      try {
        await api.put(
          `/api/admin/products/${productForm.id}`,
          {
            name: productForm.name,
            description: productForm.description,
            price: parseFloat(productForm.price),
            imageUrl: productForm.imageUrl,
            categoryName: productForm.categoryName,
            stockQuantity: Number(productForm.stockQuantity),
            condition: productForm.condition,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        Swal.fire({
          title: 'Success',
          text: 'Product updated successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        setIsProductModalOpen(false);
        fetchProducts();
      } catch (error) {
        console.error('Error updating product:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401
            ? 'Unauthorized, please log in'
            : `Failed to update product: ${error.response?.data?.message || error.message}`,
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          navigate('/login');
        }
      }
    },
    [productForm, fetchProducts, token, navigate, darkMode]
  );

  const deleteProduct = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#374151',
        confirmButtonText: 'Yes, delete it!',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });

      if (!result.isConfirmed) return;

      try {
        await api.delete(`/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'Product has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401
            ? 'Unauthorized, please log in'
            : `Failed to delete product: ${error.response?.data?.message || error.message}`,
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          navigate('/login');
        }
      }
    },
    [fetchProducts, token, navigate, darkMode]
  );

  useEffect(() => {
    fetchProducts();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchProducts]);

  const conditionOptions = [
    { value: '', label: 'Select Condition' },
    { value: 'NEW', label: 'New' },
    { value: 'USED', label: 'Used' },
    { value: 'REFURBISHED', label: 'Refurbished' },
  ];

  return (
    <div style={{ marginLeft: '250px' }} className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiBox /> Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Monitor and manage shop products</p>
        </div>
        {loadingProducts ? (
          <ProductsSkeleton darkMode={darkMode} />
        ) : (
          <ProductSection
            products={products}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            darkMode={darkMode}
          />
        )}
        {isProductModalOpen && (
          <Modal
            onClose={() => setIsProductModalOpen(false)}
            title="Update Product"
            darkMode={darkMode}
          >
            <form onSubmit={handleProductUpdate} className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  Product Information
                  <button
                    onClick={() => copyToClipboard(productForm.id)}
                    className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                    title="Copy Product ID"
                  >
                    <FiCopy size={16} />
                    <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                      Copy Product ID
                    </span>
                  </button>
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Name</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none px-3 py-2.5 transition-all duration-300"
                      placeholder="Product Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description</label>
                    <input
                      type="text"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none px-3 py-2.5 transition-all duration-300"
                      placeholder="Product Description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Price (EGP)</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none px-3 py-2.5 transition-all duration-300"
                      placeholder="Product Price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Image URL</label>
                    <input
                      type="text"
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none px-3 py-2.5 transition-all duration-300"
                      placeholder="Product Image URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Category</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-left flex items-center justify-between focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                      >
                        <span>{productForm.categoryName || 'Select Category'}</span>
                        <FiChevronDown className={`transform transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isCategoryDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setProductForm({ ...productForm, categoryName: cat.name });
                                  setIsCategoryDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200"
                              >
                                {cat.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No categories available</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Condition</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsConditionDropdownOpen(!isConditionDropdownOpen)}
                        className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-left flex items-center justify-between focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                      >
                        <span>{conditionOptions.find((opt) => opt.value === productForm.condition)?.label || 'Select Condition'}</span>
                        <FiChevronDown className={`transform transition-transform ${isConditionDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isConditionDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                          {conditionOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setProductForm({ ...productForm, condition: option.value });
                                setIsConditionDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-200"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Stock Quantity</label>
                    <input
                      type="number"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                      className="w-full rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none px-3 py-2.5 transition-all duration-300"
                      placeholder="Stock Quantity"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                >
                  Update
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
