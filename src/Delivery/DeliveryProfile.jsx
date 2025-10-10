import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiClock, FiMail, FiUser, FiEdit3, FiCheckCircle, FiTrendingUp } from "react-icons/fi";
import { getDeliveryProfile, updateDeliveryProfile } from "../api/deliveryApi";

const DeliveryProfile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({ name: "", address: "", phone: "" });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDeliveryProfile();
      console.log(data);
      setProfile(data);
      setForm({ name: data.name || "", address: data.address || "", phone: data.phone || "" });
    } catch (err) {
      toast.error("Failed to load profile. Please try again.");
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const validateForm = () => {
    const errors = { name: "", address: "", phone: "" };
    let isValid = true;

    if (!form.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    }
    if (!form.address.trim()) {
      errors.address = "Address is required";
      isValid = false;
    }
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\+?\d{10,15}$/.test(form.phone.trim())) {
      errors.phone = "Invalid phone number format";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Please fix the form errors before saving.");
      return;
    }

    try {
      setIsLoading(true);
      await updateDeliveryProfile(form);
      const updatedProfile = await getDeliveryProfile();
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => (date ? new Date(date).toLocaleString() : "N/A");

  const getStatusBadge = (status) => {
    const colors = {
      APPROVED: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
      PENDING: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100",
      REJECTED: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",
      default: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100",
    };
    return colors[status] || colors.default;
  };

  if (isLoading && !profile) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <h2 className="text-4xl font-bold mb-6 text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
        <FiUser className="text-4xl" /> Welcome, {profile.name || "Delivery Person"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 shadow-lg border-l-4 border-indigo-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active Orders</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiTrendingUp /> {profile.activeOrderDeliveries || 0}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4  shadow-lg border-l-4 border-yellow-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active Repairs</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiTrendingUp /> {profile.activeRepairDeliveries || 0}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4  shadow-lg border-l-4 border-green-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Completed</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiCheckCircle /> {profile.totalCompletedDeliveries || 0}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4  shadow-lg border-l-4 border-purple-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
              profile.status
            )}`}
          >
            {profile.status || "UNKNOWN"}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 space-y-6">
        <div>
          <strong className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <FiMail /> Email
          </strong>
          <p className="text-gray-700 dark:text-gray-200 break-words">{profile.email}</p>
        </div>
        <div>
          <strong className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
            <FiClock /> Created
          </strong>
          <p className="text-gray-700 dark:text-gray-200">{formatDate(profile.createdAt)}</p>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              profile.verified
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
            }`}
          >
            {profile.verified ? "Verified" : "Not Verified"}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              profile.activate
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
            }`}
          >
            {profile.activate ? "Active" : "Inactive"}
          </span>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              value={form.name}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {formErrors.name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              value={form.address}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.address ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {formErrors.address && (
              <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              value={0 + form.phone}
              disabled={!isEditing}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.phone ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FiEdit3 /> Edit Profile
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleUpdate}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FiCheckCircle /> {isLoading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setForm({
                    name: profile.name || "",
                    address: profile.address || "",
                    phone: profile.phone || "",
                  });
                  setFormErrors({ name: "", address: "", phone: "" });
                  setIsEditing(false);
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryProfile;