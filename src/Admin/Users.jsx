import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiSearch,
  FiCheck,
  FiInfo,
  FiX,
  FiUser,
  FiHash,
  FiMail,
  FiPhone,
  FiBriefcase,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { debounce } from 'lodash';
import api from '../api';
import Modal from '../components/Modal';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const UsersSkeleton = ({ darkMode }) => (
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
      <div className="relative w-full sm:w-80 mb-6">
        <div className="h-10 w-full bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
      </div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            {['ID', 'Name', 'Email', 'Role', 'Status', 'Actions'].map((header, idx) => (
              <th
               jny={idx}
                className="px-6 py-3 text-center text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, idx) => (
            <tr key={idx}>
              <td className="px-6 py-4">
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-48 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </td>
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
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
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
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${darkMode ? '#34d399' : '#10b981'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${darkMode ? '#6ee7b7' : '#059669'};
          }
        `}
      </style>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
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
                    <FiUsers className="text-4xl text-gray-400 dark:text-gray-500" />
                    <p className="text-lg font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8 pb-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              <FiChevronLeft /> Prev
            </button>

            {getPageNumbers().map((pageNum, idx) => (
              <button
                key={idx}
                onClick={() => typeof pageNum === 'number' && setPage(pageNum)}
                disabled={pageNum === '...'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pageNum === '...'
                    ? 'cursor-default text-gray-500 dark:text-gray-400'
                    : page === pageNum
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm font-medium"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const UsersPage = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [roleUpdates, setRoleUpdates] = useState({});

  const computedStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.activate).length;
    const inactiveUsers = totalUsers - activeUsers;
    return { totalUsers, activeUsers, inactiveUsers };
  }, [users]);

  const handleSearchChange = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
      setUserPage(1);
    }, 300),
    []
  );

  const copyToClipboard = useCallback(
    (id) => {
      navigator.clipboard.writeText(id).then(
        () => {
          Swal.fire({
            title: 'Copied!',
            text: 'User ID copied!',
            icon: 'success',
            toast: true,
            position: 'top-end',
            timer: 1500,
            showConfirmButton: false,
            background: darkMode ? '#1f2937' : '#fff',
            color: darkMode ? '#d1d5db' : '#111',
          });
        },
        () => {
          Swal.fire({ title: 'Error', text: 'Failed to copy', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
        }
      );
    },
    [darkMode]
  );

  const fetchUsers = useCallback(async () => {
    if (!token) {
      Swal.fire({ title: 'Error', text: 'Please log in.', icon: 'error' });
      navigate('/login');
      return;
    }

    const controller = new AbortController();
    try {
      setLoadingUsers(true);
      const { data } = await api.get('/api/admin/users?page=0&size=100', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${token}` },
      });
      const userList = Array.isArray(data) ? data : data?.content || [];
      setUsers(userList);
    } catch (error) {
      const msg = error.response?.status === 401 ? 'Session expired.' : 'Failed to load users.';
      Swal.fire({ title: 'Error', text: msg, icon: 'error' });
      if (error.response?.status === 401) {
        ['authToken', 'refreshToken', 'userId'].forEach((k) => localStorage.removeItem(k));
        navigate('/login');
      }
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
    return () => controller.abort();
  }, [token, navigate]);

  const activateUser = async (id) => {
    try {
      await api.put(`/api/admin/users/${id}/activate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Success', text: 'User activated', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchUsers();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to activate', icon: 'error' });
    }
  };

  const deactivateUser = async (id) => {
    try {
      await api.put(`/api/admin/users/${id}/deactivate`, {}, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Success', text: 'User deactivated', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchUsers();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to deactivate', icon: 'error' });
    }
  };

  const updateRole = async (id, role) => {
    try {
      await api.put(`/api/admin/users/${id}`, { role }, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Success', text: `Role updated to ${role}`, icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      setRoleUpdates((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      fetchUsers();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to update role', icon: 'error' });
    }
  };

  const deleteUser = async (id) => {
    const result = await Swal.fire({
      title: 'Delete User?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire({ title: 'Deleted!', text: 'User removed', icon: 'success', toast: true, position: 'top-end', timer: 1500 });
      fetchUsers();
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to delete', icon: 'error', toast: true, position: 'top-end', timer: 1500 });
    }
  };

  const viewUser = async (id) => {
    try {
      const { data } = await api.get(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedUser(data);
    } catch (error) {
      Swal.fire({ title: 'Error', text: 'Failed to load user', icon: 'error' });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [users, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    handleSearchChange(search);
  }, [search, handleSearchChange]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 mt-16 ml-3">
      <div className="max-w-7xl mx-auto space-y-8">

      
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
            <FiUsers /> Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage user accounts, roles, and status</p>
        </div>

        {loadingUsers ? (
          <UsersSkeleton darkMode={darkMode} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">

         
         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 border-b border-gray-200 dark:border-gray-700">
  {[
    { label: 'Total Users', value: computedStats.totalUsers, color: 'emerald', icon: FiUsers },
    { label: 'Active', value: computedStats.activeUsers, color: 'green', icon: FiCheckCircle },
    { label: 'Inactive', value: computedStats.inactiveUsers, color: 'red', icon: FiXCircle },
  ].map((stat, i) => (
    <div
      key={i}
      className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="text-left">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
        <p className={`text-3xl font-bold mt-2 text-${stat.color}-600 dark:text-${stat.color}-500`}>
          {stat.value}
        </p>
      </div>

   
      <div className={`p-4 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
        <stat.icon className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
      </div>
    </div>
  ))}
</div>

         
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="relative max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <FiXCircle />
                  </button>
                )}
              </div>
            </div>

            
            <div className="p-6">
              <PaginatedTable
                data={filteredUsers}
                columns={['ID', 'Name', 'Email', 'Role', 'Status', 'Actions']}
                page={userPage}
                setPage={setUserPage}
                pageSize={itemsPerPage}
                darkMode={darkMode}
                renderRow={(user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="truncate max-w-32">{user.id}</span>
                        <button
                          onClick={() => copyToClipboard(user.id)}
                          className="text-gray-500 hover:text-emerald-600"
                          title="Copy ID"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-600">
                      
                      {DOMPurify.sanitize(`${user.firstName || ''} ${user.lastName || ''}`.trim()) || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm">{DOMPurify.sanitize(user.email) || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <select
                          value={roleUpdates[user.id] || user.role}
                          onChange={(e) => setRoleUpdates((p) => ({ ...p, [user.id]: e.target.value }))}
                          className="px-3 py-1 text-sm border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SHOP_OWNER">SHOP_OWNER</option>
                        </select>
                        <button
                          onClick={() => updateRole(user.id, roleUpdates[user.id] || user.role)}
                          className="px-3 py-1 text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800"
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.activate
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {user.activate ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => viewUser(user.id)}
                          className="p-2  bg-blue-50 border flex gap-2 items-center  border-blue-200 dark:bg-gray-950 dark:border-gray-900 font-semibold  text-xs rounded-lg text-blue-600   rounded-lg"
                          title="View"
                        >
                          <FiInfo/> View
                        </button>
                        {user.activate ? (
                          <button
                            onClick={() => deactivateUser(user.id)}
                            className="p-2  bg-purple-50 flex gap-2 items-center   text-xs border border-purple-200 dark:bg-gray-950 dark:border-gray-900 font-semibold  text-purple-600 rounded-lg  rounded-lg"
                            title="Deactivate"
                          >
                            <FiX/>Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => activateUser(user.id)}
                            className="p-2  bg-green-50 flex gap-2 items-center  text-xs rounded-lg border border-green-200 dark:bg-gray-950 dark:border-gray-900 font-semibold text-green-600  rounded-lg"
                            title="Activate"
                          >
                            <FiCheck/> Approve
                          </button>
                        )}
                        {/* <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2  bg-red-50  text-xs rounded-lg border border-gray-200 dark:bg-gray-950 dark:border-gray-900 font-semibold text-red-600  rounded-lg"
                          title="Delete"
                        >
                       Delete
                        </button> */}
                      </div>
                    </td>
                  </tr>
                )}
                emptyMessage="No users found"
              />
            </div>
          </div>
        )}


       {selectedUser && (
  <Modal onClose={() => setSelectedUser(null)} title="User Details" darkMode={darkMode}>
    <div className="space-y-6 text-sm">

      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">User Information</h4>
          <button
            onClick={() => copyToClipboard(selectedUser.id)}
            className="text-gray-500 hover:text-emerald-600 transition flex items-center gap-2"
            title="Copy User ID"
          >
            <FiCopy className="w-5 h-5" />
            <span className="text-xs">Copy ID</span>
          </button>
        </div>

        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <FiHash className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">ID</p>
              <p className="font-medium">{selectedUser.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <FiUser className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Name</p>
              <p className="font-medium">{DOMPurify.sanitize(`${selectedUser.firstName} ${selectedUser.lastName}`)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <FiMail className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Email</p>
              <p className="font-medium">{DOMPurify.sanitize(selectedUser.email)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <FiPhone className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Phone</p>
              <p className="font-medium">0{selectedUser.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <FiBriefcase className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-gray-500 dark:text-gray-400">Role</p>
              <p className="font-medium capitalize">{selectedUser.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {selectedUser.activate ? (
              <FiCheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <FiXCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className="text-gray-500 dark:text-gray-400">Status</p>
              <p className={`font-medium ${selectedUser.activate ? 'text-green-600' : 'text-red-600'}`}>
                {selectedUser.activate ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

   
      <div className="flex justify-end gap-3">
        <button
          onClick={() => setSelectedUser(null)}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-md"
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