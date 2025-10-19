import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ProfileSkeleton = ({ darkMode }) => (
  <div className="p-4 sm:p-6 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900 w-full space-y-6 animate-pulse">
    <div className="h-8 w-1/3 sm:w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-950 p-4 rounded-xl shadow-md border-l-4 border-gray-300 dark:border-gray-700"
        >
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
    <div className="bg-white dark:bg-gray-950 shadow rounded-xl overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="h-6 w-1/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
      </div>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx}>
              <div className="h-4 w-1/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-1/4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
          <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    </div>
  </div>
);

const AssignerProfile = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({ name: '', department: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
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
      const response = await api.get('/api/assigner/profile', {
        signal: controller.signal,
      });
      const data = response.data;
      setProfile(data);
      setForm({
        name: data.name || '',
        department: data.department || '',
        phone: data.phone || '',
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching profile:', err.response?.data || err.message);
        Swal.fire({
          title: 'Error',
          text: err.response?.data?.message || 'Failed to load profile data',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
        });
        if (err.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userId');
          navigate('/login');
        }
      }
    } finally {
      setIsLoading(false);
    }
    return () => controller.abort();
  }, [darkMode, navigate, token]);

  const handleUpdate = useCallback(async () => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to update your profile?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4f46e5',
      customClass: { tardi: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
    });

    if (!confirm.isConfirmed) return;

    try {
      setIsLoading(true);
      await api.put('/api/assigner/profile', form);
      await fetchProfile();
      setIsEditing(false);
      Swal.fire({
        title: 'Success',
        text: 'Profile updated successfully',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } catch (err) {
      console.error('Error updating profile:', err.response?.data || err.message);
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.message || 'Failed to update profile',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-gray-800 dark:text-white' : '' },
      });
    } finally {
      setIsLoading(false);
    }
  }, [darkMode, form, fetchProfile]);

  const handleCancel = useCallback(() => {
    setForm({
      name: profile.name || '',
      department: profile.department || '',
      phone: profile.phone || '',
    });
    setIsEditing(false);
  }, [profile]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400',
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return statusColors[status] || statusColors.default;
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading && !profile.id) {
    return <ProfileSkeleton darkMode={darkMode} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:pl-72 transition-colors duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-4 sm:mb-6">
          Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-950 p-4  shadow-md border-l-4 border-indigo-500 transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</h3>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {profile.totalAssignmentsHandled || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-950 p-4  shadow-md border-l-4 border-yellow-500 transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Assignments</h3>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              {profile.pendingAssignments || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-950 p-4  shadow-md border-l-4 border-green-500 transition-all duration-300 transform hover:-translate-y-1">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                profile.status
              )}`}
            >
              {profile.status || 'UNKNOWN'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-950 shadow rounded-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-0">
              Profile Information
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md w-full sm:w-auto"
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-2 rounded-xl">
                  {profile.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigner ID</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-2 rounded-xl">
                  {profile.id || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-2 rounded-xl">
                    {profile.name || 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-2 rounded-xl">
                    {profile.department || 'N/A'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 block w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-2 rounded-xl">
                    {profile.phone ? `0${profile.phone}` : 'N/A'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 p-2 rounded-xl">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.verified ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400'}`}
                  >
                    {profile.verified ? 'Verified' : 'Not Verified'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.activate ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400'}`}
                  >
                    {profile.activate ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isLoading ? 'Updating...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignerProfile;