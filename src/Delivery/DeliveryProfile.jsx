import React, { useEffect, useState, useCallback } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiEdit3,
  FiCheckCircle, FiX, FiShield, FiTrendingUp, FiAward,
  FiTool
} from "react-icons/fi";
import { getDeliveryProfile, updateDeliveryProfile } from "../api/deliveryApi";

const DeliveryProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDeliveryProfile();
      setProfile(data);
      setForm({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || ""
      });
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.address.trim()) errors.address = "Address is required";
    if (!form.phone.trim()) errors.phone = "Phone is required";
    else if (!/^\+?\d{10,15}$/.test(form.phone.trim())) {
      errors.phone = "Enter a valid phone number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await updateDeliveryProfile(form);
      const updated = await getDeliveryProfile();
      setProfile(updated);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : "N/A";

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950/30 flex items-center justify-center pt-20">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <ToastContainer position="top-right" theme={document.documentElement.classList.contains("dark") ? "dark" : "light"} />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-950 pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">

      
          <div className="text-center mb-12 mt-5">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-2xl mb-6">
              <FiUser size={64} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white">
              Welcome back, <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {profile.name || "Delivery Agent"}
              </span>
            </h1>
            <p className="mt-3 text-xl text-gray-600 dark:text-gray-400">
              Manage your profile and delivery stats
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { label: "Active Orders", value: profile.activeOrderDeliveries || 0, icon: FiTrendingUp, gradient: "from-emerald-500 to-teal-600" },
              { label: "Active Repairs", value: profile.activeRepairDeliveries || 0, icon: FiTool, gradient: "from-purple-500 to-pink-600" },
              { label: "Total Completed", value: profile.totalCompletedDeliveries || 0, icon: FiAward, gradient: "from-orange-500 to-red-600" },
              { label: "Account Status", value: profile.status || "PENDING", icon: FiShield, gradient: "from-blue-500 to-cyan-600" }
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative bg-white dark:bg-gray-900 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-3"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="p-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg mb-4`}>
                    <stat.icon size={32} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                    {typeof stat.value === "string" ? (
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${stat.gradient} text-white`}>
                        {stat.value}
                      </span>
                    ) : stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

      
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600"></div>

            <div className="p-8 lg:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-4">
                  <FiUser className="text-emerald-600" size={36} />
                  Profile Information
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg flex items-center gap-3"
                  >
                    <FiEdit3 size={20} /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdate}
                      disabled={isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg flex items-center gap-3"
                    >
                      <FiCheckCircle size={20} /> {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setForm({ name: profile.name || "", address: profile.address || "", phone: profile.phone || "" });
                        setFormErrors({});
                        setIsEditing(false);
                      }}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-lg flex items-center gap-3"
                    >
                      <FiX size={20} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <FiMail className="text-emerald-600" size={28} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email Address</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-5 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-200 dark:border-teal-800">
                    <FiClock className="text-teal-600" size={28} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                      <p className="font-semibold text-gray-800 dark:text-white">{formatDate(profile.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <span className={`px-5 py-3 rounded-full font-bold text-sm ${profile.verified ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'}`}>
                      {profile.verified ? "Verified" : "Not Verified"}
                    </span>
                    <span className={`px-5 py-3 rounded-full font-bold text-sm ${profile.activate ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}`}>
                      {profile.activate ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

               
                <div className="space-y-6">
                  {[
                    { label: "Full Name", field: "name", icon: FiUser },
                    { label: "Delivery Address", field: "address", icon: FiMapPin },
                    { label: "Phone Number", field: "phone", icon: FiPhone },
                  ].map(({ label, field, icon: Icon }) => (
                    <div key={field}>
                      <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        <Icon className="text-emerald-600" size={20} />
                        {label}
                      </label>
                      <input
                        type="text"
                        value={form[field]}
                        disabled={!isEditing}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className={`w-full px-5 py-4 rounded-2xl border-2 transition-all text-gray-800 dark:text-white ${
                          isEditing
                            ? 'bg-white dark:bg-gray-800 border-emerald-300 dark:border-emerald-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 cursor-not-allowed'
                        } ${formErrors[field] ? 'border-red-500' : ''}`}
                        placeholder={isEditing ? `Enter your ${label.toLowerCase()}...` : 'Not set'}
                      />
                      {formErrors[field] && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-2">
                          {formErrors[field]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeliveryProfile;