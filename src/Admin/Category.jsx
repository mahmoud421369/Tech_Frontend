import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiList,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiCopy,
  FiSearch,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const CategoriesSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
        <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="h-10 w-full sm:w-80 bg-gray-300 dark:bg-gray-600 rounded-lg mb-6"></div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Name', 'Actions'].map((_, idx) => (
              <th key={idx} className="px-6 py-3">
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
            {paginatedData.map(renderRow)}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-3">
                    <FiList className="text-4xl text-gray-400 dark:text-gray-500" />
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
              <FiChevronLeft /> Prev
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

const Categories = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const fetchCategories = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.get('/api/admin/categories', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const processed = Array.isArray(data) ? data : data?.content || [];
      setCategories(processed);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load categories.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach(k => localStorage.removeItem(k));
        navigate('/login');
      }
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  const saveCategory = async () => {
    if (!categoryName.trim()) {
      Swal.fire({ title: 'Error', text: 'Category name is required.', icon: 'error' });
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
        Swal.fire({ title: 'Updated!', text: 'Category updated.', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      } else {
        await api.post(
          '/api/admin/categories',
          { name: categoryName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({ title: 'Added!', text: 'Category created.', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      }
      setCategoryName('');
      setEditingCategory(null);
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to save category.', icon: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Category?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    try {
      setIsLoading(true);
      await api.delete(`/api/admin/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Deleted!', text: 'Category removed.', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchCategories();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to delete.', icon: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(
      () => Swal.fire({ title: 'Copied!', text: 'Category ID copied!', icon: 'success', toast: true, position: 'top-end', timer: 1000 }),
      () => Swal.fire({ title: 'Error', text: 'Failed to copy', icon: 'error', toast: true, position: 'top-end', timer: 1000 })
    );
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const lower = searchTerm.toLowerCase();
    return categories.filter(c => c.name?.toLowerCase().includes(lower));
  }, [categories, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-14">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
              <FiList /> Categories
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage product categories</p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryName('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <FiPlus /> Add Category
          </button>
        </div>

        {isLoading ? (
          <CategoriesSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

            {/* Stats */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Categories</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{categories.length}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative max-w-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      <FiXCircle />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="p-6">
              <PaginatedTable
                data={filteredCategories}
                columns={['ID', 'Name', 'Actions']}
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                darkMode={darkMode}
                renderRow={(c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="truncate max-w-32">{c.id}</span>
                        <button onClick={() => copyToClipboard(c.id)} className="text-gray-500 hover:text-emerald-600">
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{c.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setCategoryName(c.name || '');
                            setIsModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(c.id)}
                          className="px-3 py-1.5 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage={categories.length === 0 ? 'No categories available' : 'No matching categories'}
              />
            </div>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'} darkMode={darkMode}>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Category Details</h4>
                  {editingCategory && (
                    <button onClick={() => copyToClipboard(editingCategory.id)} className="text-gray-500 hover:text-emerald-600">
                      <FiCopy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {editingCategory && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>ID:</strong> {editingCategory.id}
                  </p>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCategory}
                  disabled={isLoading || !categoryName.trim()}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {editingCategory ? 'Update' : 'Create'}
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