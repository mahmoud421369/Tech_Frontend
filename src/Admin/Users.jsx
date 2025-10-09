
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiEye, FiCheckCircle, FiXCircle, FiTrash2, FiChevronLeft, FiChevronRight, FiCopy, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import api from '../api';
import Modal from '../components/Modal';


const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);


const UsersSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-6">
    <div className="space-y-4 mb-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow">
          <div className="h-6 w-1/2 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
          <div className="h-8 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        <div className="relative w-full md:w-64">
          <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['Name', 'Email', 'Role', 'Status', 'Actions'].map((header, idx) => (
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
              <td className="px-6 py-4">
                <div className="flex justify-center gap-2">
                  <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
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
        <thead className="bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-6 py-3 text-center font-medium uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-200">
          {paginatedData.map(renderRow)}
          {paginatedData.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-4 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <FiUsers className="text-2xl text-gray-500 dark:text-gray-400" />
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
            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <FiChevronLeft /> Previous
          </button>
          {getPageNumbers().map((pageNum, idx) => (
            <button
              key={idx}
              onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
              className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                pageNum === '...' ? 'cursor-default' : page === pageNum ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-800'
              }`}
              disabled={pageNum === '...'}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            Next <FiChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};


const UserSection = ({ users, search, setSearch, activateUser, deactivateUser, updateRole, deleteUser, viewUser, darkMode, token }) => {
  const [userPage, setUserPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [roleUpdates, setRoleUpdates] = useState({});

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setSearch(value);
      setUserPage(1);
    }, 300),
    [setSearch]
  );

 const copyToClipboard = useCallback(
    (id) => {
      navigator.clipboard.writeText(id).then(
        () => {
          Swal.fire({
            title: 'Success',
            text: 'User ID copied to clipboard!',
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
            text: 'Failed to copy User ID',
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

  const computedStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.activate).length;
    const inactiveUsers = users.filter((u) => !u.activate).length;
    return { totalUsers, activeUsers, inactiveUsers };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [users, debouncedSearch]);

 
  

  return (
    <section className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Total Users</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.totalUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Active Users</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.activeUsers}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">Inactive Users</h3>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{computedStats.inactiveUsers}</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 mb-6">
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleSearchChange(e.target.value);
            }}
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                handleSearchChange('');
                setUserPage(1);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <FiXCircle />
            </button>
          )}
        </div>
      </div>
      <PaginatedTable
        data={filteredUsers}
        columns={['ID', 'Name', 'Email', 'Role', 'Status', 'Actions']}
        page={userPage}
        setPage={setUserPage}
        pageSize={5}
        darkMode={darkMode}
        renderRow={(user) => (
          <tr
            key={user.id}
            className="text-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300"
          >
            <td className="px-6 py-4 text-sm flex items-center justify-center gap-2">
              {user.id}
              <button
                onClick={() => copyToClipboard(user.id)}
                className="relative group p-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                title="Copy User ID"
              >
                <FiCopy />
                <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2">
                  Copy User ID
                </span>
              </button>
            </td>
            <td className="px-6 py-4">{DOMPurify.sanitize(`${user.firstName} ${user.lastName}`) || 'N/A'}</td>
            <td className="px-6 py-4">{DOMPurify.sanitize(user.email) || 'N/A'}</td>
            <td className="px-6 py-4 flex justify-center gap-2">
              <select
                value={roleUpdates[user.id] || user.role}
                onChange={(e) =>
                  setRoleUpdates((prev) => ({
                    ...prev,
                    [user.id]: e.target.value,
                  }))
                }
                className="border rounded-lg px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SHOP_OWNER">SHOP_OWNER</option>
              </select>
              <button
                onClick={() => updateRole(user.id, roleUpdates[user.id] || user.role)}
                className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300"
              >
                Save
              </button>
            </td>
            <td className="px-6 py-4">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.activate
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                }`}
              >
                {user.activate ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-6 py-4 flex justify-center gap-2">
              <button
                onClick={() => viewUser(user.id)}
                className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-300"
              >
                <FiEye />
              </button>
              {!user.activate ? (
                <button
                  onClick={() => activateUser(user.id)}
                  className="p-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-all duration-300"
                >
                  <FiCheckCircle />
                </button>
              ) : (
                <button
                  onClick={() => deactivateUser(user.id)}
                  className="p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-all duration-300"
                >
                  <FiXCircle />
                </button>
              )}
              <button
                onClick={() => deleteUser(user.id)}
                className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-300"
              >
                <FiTrash2 />
              </button>
            </td>
          </tr>
        )}
        emptyMessage="No users found"
      />
    </section>
  );
};


const UsersPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
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
    setLoadingUsers(true);
    const controller = new AbortController();
    try {
      const response = await api.get('/api/admin/users?page=0&size=5', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data.content || response.data || [];
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      Swal.fire({
        title: 'Error',
        text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to fetch users',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        navigate('/login');
      }
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
    return () => controller.abort();
  }, [token, navigate, darkMode]);

  const activateUser = useCallback(
    async (id) => {
      try {
        await api.put(`/api/admin/users/${id}/activate`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'User has been activated.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchUsers();
      } catch (error) {
        console.error('Error activating user:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to activate user',
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
    [fetchUsers, token, navigate, darkMode]
  );

  const deactivateUser = useCallback(
    async (id) => {
      try {
        await api.put(`/api/admin/users/${id}/deactivate`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'User has been deactivated.',
          icon: 'warning',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deactivating user:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to deactivate user',
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
    [fetchUsers, token, navigate, darkMode]
  );

  const updateRole = useCallback(
    async (id, role) => {
      try {
        await api.put(
          `/api/admin/users/${id}`,
          { role },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
        Swal.fire({
          title: 'Success',
          text: `User role updated to ${role}.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchUsers();
      } catch (error) {
        console.error('Error updating role:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401
            ? 'Unauthorized, please log in'
            : `Failed to update role: ${error.response?.data?.message || error.message}`,
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
    [fetchUsers, token, navigate, darkMode]
  );

  const deleteUser = useCallback(
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
        await api.delete(`/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire({
          title: 'Success',
          text: 'User has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401
            ? 'Unauthorized, please log in'
            : `Failed to delete user: ${error.response?.data?.message || error.message}`,
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
    [fetchUsers, token, navigate, darkMode]
  );

  const viewUser = useCallback(
    async (id) => {
      try {
        const response = await api.get(`/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelectedUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error.response?.data || error.message);
        Swal.fire({
          title: 'Error',
          text: error.response?.status === 401 ? 'Unauthorized, please log in' : 'Failed to fetch user details',
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
    [token, navigate, darkMode]
  );

  useEffect(() => {
    fetchUsers();
    return () => {
      const controller = new AbortController();
      controller.abort();
    };
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 mt-14 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <FiUsers /> Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage your users, activate, deactivate, and change user roles
          </p>
        </div>
        {loadingUsers ? (
          <UsersSkeleton darkMode={darkMode} />
        ) : (
          <UserSection
            users={users}
            search={search}
            setSearch={setSearch}
            activateUser={activateUser}
            deactivateUser={deactivateUser}
            updateRole={updateRole}
            deleteUser={deleteUser}
            viewUser={viewUser}
            darkMode={darkMode}
            token={token}
          />
        )}
        {selectedUser && (
          <Modal
            onClose={() => setSelectedUser(null)}
            title={`User Details - ${DOMPurify.sanitize(`${selectedUser.firstName} ${selectedUser.lastName}`)}`}
            darkMode={darkMode}
          >
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  User Information
          
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>ID:</strong> {selectedUser.id || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Name:</strong> {DOMPurify.sanitize(`${selectedUser.firstName} ${selectedUser.lastName}`) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Email:</strong> {DOMPurify.sanitize(selectedUser.email) || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Role:</strong> {selectedUser.role || 'N/A'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  <strong>Status:</strong> {selectedUser.activate ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
