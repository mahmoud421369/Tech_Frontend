import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser, FiMail, FiPhone, FiCalendar, FiCheckCircle,
  FiXCircle, FiEdit3, FiShield, FiSave, FiX, FiInfo, FiZap, FiLayout
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import api from '../api';

const showToast = (text, icon) =>
  Swal.fire({ text, icon, toast: true, position: 'top-end', showConfirmButton: false, timer: 2500, timerProgressBar: true });

const AssignerProfile = ({ darkMode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const [profile, setProfile]     = useState({});
  const [form, setForm]           = useState({ name: '', department: '', phone: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { 
    document.title = 'Assigner - Premium Profile'; 
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!token) { navigate('/login'); return; }
    try {
      setIsLoading(true);
      const res  = await api.get('/api/assigner/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      setProfile(data);
      setForm({ name: data.name || '', department: data.department || '', phone: data.phone || '' });
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); navigate('/login'); }
      else showToast('Failed to load profile', 'error');
    } finally { setIsLoading(false); }
  }, [token, navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleUpdate = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Save Profile Changes?',
      text: 'Update your administrative information',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Save',
      confirmButtonColor: '#84cc16',
      background: darkMode ? '#1f2937' : '#fff',
      color: darkMode ? '#fff' : '#000',
    });
    if (!isConfirmed) return;

    try {
      setIsLoading(true);
      await api.put('/api/assigner/profile', form, { headers: { Authorization: `Bearer ${token}` } });
      await fetchProfile();
      setIsEditing(false);
      showToast('Profile synchronized', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Synchronization failed', 'error');
    } finally { setIsLoading(false); }
  };

  const handleCancel = () => {
    setForm({ name: profile.name || '', department: profile.department || '', phone: profile.phone || '' });
    setIsEditing(false);
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  const statusStyle = profile.status === 'APPROVED'
    ? { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' }
    : profile.status === 'PENDING'
    ? { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' }
    : { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' };

  if (isLoading && !profile.id) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="h-48 bg-white dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
          <div className="h-64 bg-white dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
        </div>
      </div>
    );
  }

  const fieldClass = "w-full px-5 py-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm font-bold text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 transition-all";
  const readClass  = "px-5 py-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-3";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

       
       
        <div className="relative bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden p-8 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-bl-full translate-x-16 -translate-y-16 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-700" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-lime-400 to-emerald-500 p-1">
                <div className="w-full h-full rounded-[2.2rem] bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                  <FiUser size={64} className="text-lime-500" />
                </div>
              </div>
              <div className={`absolute -bottom-2 -right-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-lg ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                {profile.status}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{profile.name || 'System Assigner'}</h1>
                {profile.verified && <FiCheckCircle className="text-emerald-500 hidden md:block" size={24} />}
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">{profile.email}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <FiLayout size={14} className="text-lime-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{profile.department || 'Logistics'}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <FiShield size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">ID: {profile.id?.slice(-8)}</span>
                </div>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 rounded-2xl bg-gray-900 dark:bg-lime-500 text-white dark:text-black text-sm font-black hover:bg-lime-500 transition-all shadow-xl shadow-gray-200 dark:shadow-none active:scale-95"
              >
                Edit Account
              </button>
            )}
          </div>
        </div>

        
        
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-lime-50 dark:bg-lime-900/30 flex items-center justify-center text-lime-500">
              <FiInfo size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Administrative Info</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Account Display Name</label>
              {isEditing
                ? <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass} />
                : <div className={readClass}><FiUser className="text-lime-500" /> {profile.name || 'N/A'}</div>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Department / Role</label>
              {isEditing
                ? <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className={fieldClass} />
                : <div className={readClass}><FiZap className="text-blue-500" /> {profile.department || 'Not Specified'}</div>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Primary Email</label>
              <div className={readClass}><FiMail className="text-orange-500" /> {profile.email}</div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Connectivity</label>
              {isEditing
                ? <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={fieldClass} />
                : <div className={readClass}><FiPhone className="text-emerald-500" /> {profile.phone || 'Not Connected'}</div>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Access Level</label>
              <div className={readClass}><FiShield className="text-purple-500" /> Full Assigner Permissions</div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Registry Date</label>
              <div className={readClass}><FiCalendar className="text-rose-500" /> {formatDate(profile.createdAt)}</div>
            </div>
          </div>

          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={handleUpdate}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-lime-500 hover:bg-lime-600 disabled:opacity-50 text-white font-black transition-all shadow-lg shadow-lime-500/20 active:scale-95"
              >
                <FiSave size={18} /> Update Administrative Profile
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="px-8 py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold transition-all active:scale-95"
              >
                Discard Changes
              </button>
            </div>
          )}
        </div>

       
       
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Security Check</p>
              <p className={`text-sm font-black ${profile.verified ? 'text-emerald-500' : 'text-gray-400'}`}>
                {profile.verified ? 'Verified Identity' : 'Pending Verification'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${profile.verified ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 group-hover:scale-110' : 'bg-gray-50 dark:bg-gray-900 text-gray-300'}`}>
              {profile.verified ? <FiCheckCircle size={24} /> : <FiXCircle size={24} />}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Service Status</p>
              <p className={`text-sm font-black ${profile.activate ? 'text-indigo-500' : 'text-red-500'}`}>
                {profile.activate ? 'Active Console' : 'Console Deactivated'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${profile.activate ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 group-hover:scale-110' : 'bg-red-50 dark:bg-red-900/20 text-red-500'}`}>
              {profile.activate ? <FiCheckCircle size={24} /> : <FiXCircle size={24} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignerProfile;