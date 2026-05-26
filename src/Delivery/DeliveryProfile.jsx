import React, { useEffect, useState, useCallback, memo } from "react";
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiEdit3,
  FiCheckCircle, FiX, FiShield, FiTrendingUp, FiAward,
  FiTool, FiSettings, FiCamera, FiAlertCircle, FiArrowRight
} from "react-icons/fi";
import Swal from "sweetalert2";
import { getDeliveryProfile, updateDeliveryProfile } from "../api/deliveryApi";
import api from "../api";
import { ProfileSkeleton } from "../components";





const StatCard = memo(({ label, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/20 dark:shadow-none hover:shadow-2xl transition-all duration-500 group">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center text-${color}-600 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
        <Icon size={24} />
      </div>
      {typeof value === "string" && (
        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 border border-${color}-100 dark:border-${color}-800`}>
          {value}
        </span>
      )}
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">{label}</p>
    {typeof value !== "string" && (
      <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</p>
    )}
  </div>
));

const Field = memo(({ icon: Icon, label, field, value, editing, onChange, error }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
      <Icon size={14} className="text-lime-500" /> {label}
    </label>
    <div className="relative group">
      <input
        type="text"
        value={value}
        disabled={!editing}
        onChange={(e) => onChange(field, e.target.value)}
        className={`w-full px-5 py-4 rounded-2xl border text-sm font-bold transition-all duration-300
          ${editing
            ? `bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-4 focus:ring-lime-500/10 focus:border-lime-200 text-gray-900 dark:text-white ${error ? "border-red-500 focus:ring-red-500" : ""}`
            : "bg-gray-50/50 dark:bg-gray-900/30 border-transparent text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
      />
      {editing && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />}
    </div>
    {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest pl-2">{error}</p>}
  </div>
));

const DeliveryProfile = () => {
  const [profile, setProfile]     = useState(null);
  const [form, setForm]           = useState({ name: "", address: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors]       = useState({});

  const showToast = useCallback((text, icon) => {
    Swal.fire({ text, icon, toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
  }, []);

  useEffect(() => {
    document.title = 'Delivery Agent Profile | Tech Restore';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = 'Manage your Tech Restore delivery dispatcher profile, secure credentials, phone number, operating area and career analytics.';
  }, []);
  

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDeliveryProfile();
      setProfile(data);
      setForm({ name: data.name || "", address: data.address || "", phone: data.phone || "" });
    } catch { showToast("Failed to load profile", "error"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const validate = useCallback(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^\+?\d{10,15}$/.test(form.phone.trim())) e.phone = "Invalid phone format";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleUpdate = useCallback(async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await updateDeliveryProfile(form);
      const updated = await getDeliveryProfile();
      setProfile(updated);
      setIsEditing(false);
      showToast("Profile synchronized successfully", "success");
    } catch (err) { showToast(err.response?.data?.message || "Update failed", "error"); }
    finally { setIsLoading(false); }
  }, [form, validate, showToast]);

  const cancelEdit = useCallback(() => {
    setForm({ name: profile?.name || "", address: profile?.address || "", phone: profile?.phone || "" });
    setErrors({});
    setIsEditing(false);
  }, [profile]);

  if (isLoading && !profile) {
    return <ProfileSkeleton />;
  }
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 lg:pl-64 mt-16 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

       
       
        <div className="relative bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none overflow-hidden p-8 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-bl-full translate-x-16 -translate-y-16 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-lime-500 to-emerald-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-lime-500/20 group-hover:scale-105 transition-transform duration-500">
                {profile.name?.charAt(0) || "A"}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 border-4 border-gray-50 dark:border-gray-900 flex items-center justify-center text-lime-500">
                <FiShield size={18} />
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-lime-50 dark:bg-lime-900/20 text-lime-600 text-[10px] font-black uppercase tracking-widest border border-lime-100 dark:border-lime-800">
                  Active Agent
                </span>
                {profile.verified && (
                  <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                    Verified
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-1">{profile.name}</h1>
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Dispatch System Personnel</p>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit Profile Details"
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-lime-500 dark:hover:bg-lime-500 hover:text-white transition-all active:scale-95 shadow-xl shadow-gray-900/10"
                >
                  <FiEdit3 size={16} /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <button 
                    onClick={handleUpdate}
                    aria-label="Save Profile Changes"
                    className="flex items-center gap-2 px-6 py-3 bg-lime-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-lime-600 transition-all active:scale-95 shadow-xl shadow-lime-500/20"
                  >
                    <FiCheckCircle size={16} /> {isLoading ? "Saving..." : "Apply Changes"}
                  </button>
                  <button 
                    onClick={cancelEdit}
                    aria-label="Cancel Profile Editing"
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

       
       

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Active Orders"    value={profile.activeOrderDeliveries || 0}   icon={FiTrendingUp} color="blue" />
          <StatCard label="Active Repairs"   value={profile.activeRepairDeliveries || 0}  icon={FiTool}       color="indigo"  />
          <StatCard label="Career Deliveries" value={profile.totalCompletedDeliveries || 0} icon={FiAward}     color="amber"   />
          <StatCard label="Account Status"   value={profile.status || "ACTIVE"}           icon={FiShield}    color="lime"    />
        </div>

     
     

        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">
              <FiSettings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Account Configuration</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personal & professional data</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-8">
              <div className="flex items-start gap-4 p-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-lime-500 shadow-sm group-hover:scale-110 transition-transform">
                  <FiMail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email Access</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all group">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-lime-500 shadow-sm group-hover:scale-110 transition-transform">
                  <FiClock size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Onboarding Date</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <Field icon={FiUser}   label="Full Display Name" field="name"    value={form.name}    editing={isEditing} onChange={(f,v) => setForm(prev => ({...prev, [f]: v}))} error={errors.name} />
              <Field icon={FiPhone}  label="Secure Phone"      field="phone"   value={form.phone}   editing={isEditing} onChange={(f,v) => setForm(prev => ({...prev, [f]: v}))} error={errors.phone} />
              <Field icon={FiMapPin} label="Operating Area"    field="address" value={form.address} editing={isEditing} onChange={(f,v) => setForm(prev => ({...prev, [f]: v}))} error={errors.address} />
            </div>
          </div>
        </div>

        
        
        {/* <div className="bg-gray-900 dark:bg-gray-800 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-lime-500/10 rounded-full -translate-x-24 -translate-y-24 blur-3xl" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-lime-500/10 flex items-center justify-center text-lime-500 border border-lime-500/20">
              <FiShield size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Security Standards</h3>
              <p className="text-sm font-bold text-gray-400">Keep your operational data updated for faster payouts.</p>
            </div>
          </div>
          <button className="relative z-10 flex items-center gap-2 px-8 py-4 bg-lime-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-lime-600 transition-all shadow-xl shadow-lime-500/20">
            Change Password <FiArrowRight />
          </button>
        </div> */}

      </div>
    </div>
  );
};

export default memo(DeliveryProfile);