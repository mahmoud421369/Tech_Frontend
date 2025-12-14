import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../api';
import {
  FiUser, FiMail, FiPhone, FiCalendar, FiCheckCircle,
  FiXCircle, FiEdit3, FiShield, FiActivity
} from 'react-icons/fi';

const AssignerProfile = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({ name: '', department: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get('/api/assigner/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data;
      setProfile(data);
      setForm({
        name: data.name || '',
        department: data.department || '',
        phone: data.phone || '',
      });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed to load profile',
          toast: true,
          position: 'top-end',
          timer: 3000
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, navigate]);

  const handleUpdate = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Update Profile?',
      text: 'Save changes to your profile information',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
    });

    if (!isConfirmed) return;

    try {
      setIsLoading(true);
      await api.put('/api/assigner/profile', form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchProfile();
      setIsEditing(false);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        toast: true,
        position: 'top-end',
        timer: 2000
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || 'Please try again',
        toast: true,
        position: 'top-end'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: profile.name || '',
      department: profile.department || '',
      phone: profile.phone || '',
    });
    setIsEditing(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';
  };

  if (isLoading && !profile.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-emerald-950/30 pt-20 lg:pl-72">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-2xl w-80"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-800">
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-40 mb-4"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 border border-gray-200 dark:border-gray-800">
              <div className="space-y-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-6 lg:pl-72 transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        
        <div className="mb-12 text-center lg:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white flex items-center gap-5 justify-center lg:justify-start">
            <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl text-white shadow-2xl">
              <FiUser size={40} />
            </div>
            My Profile,<span className='text-5xl text-teal-600 font-bold'>{profile.displayName}</span> 
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Manage your assigner account and view performance stats
          </p>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* <div className="group bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Assignments</p>
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  {profile.totalAssignmentsHandled || 0}
                </p>
              </div>
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
                <FiActivity className="text-emerald-600 dark:text-emerald-400" size={32} />
              </div>
            </div>
          </div>

          <div className="group bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Pending Tasks</p>
                <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                  {profile.pendingAssignments || 0}
                </p>
              </div>
              <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
                <FiCalendar className="text-amber-600 dark:text-amber-400" size={32} />
              </div>
            </div>
          </div> */}

          <div className="group bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Account Status</p>
                <span className={`mt-3 inline-block px-5 py-2 rounded-full text-white font-bold text-sm shadow-lg ${
                  profile.status === 'APPROVED' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' :
                  profile.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                  'bg-gradient-to-r from-red-500 to-pink-600'
                }`}>
                  {profile.status || 'UNKNOWN'}
                </span>
              </div>
              {profile.status === 'APPROVED' ? (
                <FiCheckCircle className="text-emerald-500" size={36} />
              ) : (
                <FiXCircle className="text-red-500" size={36} />
              )}
            </div>
          </div>
        </div>

        
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6 flex flex-col sm:flex-row justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FiUser size={28} />
              Profile Information
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 sm:mt-0 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all flex items-center gap-2 font-medium"
              >
                <FiEdit3 /> Edit Profile
              </button>
            )}
          </div>

          <div className="p-8 lg:p-10 space-y-8">

           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FiMail className="text-emerald-600" /> Email Address
                </label>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  {profile.email || 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FiShield className="text-teal-600" /> Assigner ID
                </label>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 px-5 py-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  {profile.id || 'N/A'}
                </p>
              </div>
            </div>

           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-lg text-gray-800 dark:text-gray-200 px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    {profile.name || 'Not set'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Department</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g., Logistics, Support"
                  />
                ) : (
                  <p className="text-lg text-gray-800 dark:text-gray-200 px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    {profile.department || 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FiPhone className="text-emerald-600" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                    placeholder="01xxxxxxxxx"
                  />
                ) : (
                  <p className="text-lg text-gray-800 dark:text-gray-200 px-5 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                    {profile.phone ? `${profile.phone}` : 'Not set'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <FiCalendar className="text-teal-600" /> Member Since
                </label>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 px-5 py-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl border border-teal-200 dark:border-teal-800">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Account Status</h4>
              <div className="flex flex-wrap gap-4">
                <span className={`px-6 py-3 rounded-2xl font-bold text-white shadow-lg ${
                  profile.verified
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-r from-gray-400 to-gray-600'
                }`}>
                  {profile.verified ? 'Verified Account' : 'Not Verified'}
                </span>
                <span className={`px-6 py-3 rounded-2xl font-bold text-white shadow-lg ${
                  profile.activate
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                    : 'bg-gradient-to-r from-red-500 to-pink-600'
                }`}>
                  {profile.activate ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            
            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={handleUpdate}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-8 py-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-all"
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