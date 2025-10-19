
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiList, FiPlus, FiEdit3, FiTrash2, FiCopy, FiSearch, FiXCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const CategoriesSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800">
        <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="relative w-full sm:w-80 mb-6">
        <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {['ID', 'Name', 'Actions'].map((header, idx) => (
              <th key={idx} className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
              <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div></td>
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
                  <FiList className="text-2xl text-gray-500 dark:text-gray-400" />
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

const Categories = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  const copyToClipboard = useCallback(
    (id) => {
      navigator.clipboard.writeText(id).then(
        () => {
          Swal.fire({
            title: 'Success',
            text: 'Category ID copied to clipboard!',
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
            text: 'Failed to copy Category ID',
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

  const fetchCategories = useCallback(async () => {
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

    const controller = new AbortController();
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/categories', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      let data = response.data;
      if (response.data && response.data.content) {
        data = response.data.content;
      }
      data = Array.isArray(data) ? data : [];
      console.log('Processed Category Data:', data);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to load categories',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [token, navigate, darkMode]);

  const saveCategory = useCallback(async () => {
    if (!categoryName.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Category name is required',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      return;
    }

    try {
      setIsLoading(true);
      if (editingCategory) {
        await api.put(
          `/api/admin/categories/${editingCategory.id}`,
          { name: categoryName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: 'Success',
          text: 'Category updated successfully',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      } else {
        await api.post(
          '/api/admin/categories',
          { name: categoryName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({
          title: 'Success',
          text: 'Category added successfully',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
      }
      setCategoryName('');
      setEditingCategory(null);
      setIsModalOpen(false);
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to save category',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [editingCategory, categoryName, token, fetchCategories, darkMode]);

  const deleteCategory = useCallback(
    async (id) => {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#374151',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });

      if (!result.isConfirmed) return;

      try {
        setIsLoading(true);
        await api.delete(`/api/admin/categories/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'Category deleted successfully',
          icon: 'success',
          toast: true,
          position: 'top-end',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        await fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to delete category',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [token, fetchCategories, darkMode]
  );

  const filteredCategories = useMemo(() => {
    const categoriesArray = Array.isArray(categories) ? categories : [];
    return categoriesArray.filter((c) =>
      c.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [categories, debouncedSearchTerm]);

  useEffect(() => {
    fetchCategories();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchCategories]);

  useEffect(() => {
    handleSearchChange(searchTerm);
  }, [searchTerm, handleSearchChange]);

  return (
    <div style={{ marginLeft: '250px' }} className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex justify-between flex-wrap gap-4 items-center">
          <div>
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <FiList /> Categories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Add, edit, and delete categories</p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setEditingCategory(null);
              setCategoryName('');
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
          >
            <FiPlus /> Add Category
          </button>
        </div>

        {isLoading ? (
          <CategoriesSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-950 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            {/* Stats Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
                <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Total Categories</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{categories.length}</p>
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <div className="w-full sm:w-80 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Categories</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                  <input
                    type="text"
                    placeholder="Search by category name..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCurrentPage(1);
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
              data={filteredCategories}
              columns={['ID', 'Name', 'Actions']}
              page={currentPage}
              setPage={setCurrentPage}
              pageSize={itemsPerPage}
              darkMode={darkMode}
              renderRow={(c) => (
                <tr
                  key={c.id}
                  className="text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-300"
                >
                  <td className="px-6 py-4 text-sm font-medium flex items-center justify-center gap-2">
                    <span className="truncate max-w-[150px]">{c.id}</span>
                    <button
                      onClick={() => copyToClipboard(c.id)}
                      className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      title="Copy Category ID"
                    >
                      <FiCopy size={16} />
                      <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        Copy Category ID
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{c.name || 'N/A'}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCategory(c);
                        setCategoryName(c.name || '');
                        setIsModalOpen(true);
                      }}
                      className="p-2 bg-indigo-100 text-xs dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800/70 transition-all duration-300"
                      title="Edit Category"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(c.id)}
                      className="p-2 bg-red-100 text-xs dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800/70 transition-all duration-300"
                      title="Delete Category"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )}
              emptyMessage={categories.length === 0 ? 'No categories available' : 'No categories found'}
            />
          </div>
        )}

        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add New Category'} darkMode={darkMode}>
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  Category Details
                  {editingCategory && (
                    <button
                      onClick={() => copyToClipboard(editingCategory.id)}
                      className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                      title="Copy Category ID"
                    >
                      <FiCopy size={16} />
                      <span className="absolute hidden group-hover:block bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        Copy Category ID
                      </span>
                    </button>
                  )}
                </h4>
                {editingCategory && (
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    <strong>Category ID:</strong> {editingCategory.id || 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Category Name
                </label>
                <div className="relative">
                  <FiList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCategory}
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : null}
                  Save
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Categories;
