import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getDeliveryProfile } from "../api/deliveryApi";
import {
  FiClock,
  FiMail,
  FiUser,
  FiEdit3,
  FiCheckCircle,
  FiTrendingUp,
} from "react-icons/fi";

const DeliveryProfile = () => {
  const token = localStorage.getItem("authToken");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    getDeliveryProfile(token)
      .then((p) => {
        setProfile(p);
        setForm({ name: p.name || "", address: p.address || "", phone: p.phone || "" });
      })
      .catch((err) => {
        console.error(err);
        Swal.fire("Error", "Failed to load profile", "error");
      });
  }, [token]);

  const handleUpdate = async () => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update your profile?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch("http://localhost:8080/api/delivery/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error("Update failed");

      const updated = await getDeliveryProfile(token);
      setProfile(updated);
      Swal.fire("Success", "Profile updated successfully", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire("Error", "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="p-6">Loading...</div>;

  const formatDate = (date) => (date ? new Date(date).toLocaleString() : "N/A");
  const getStatusBadge = (status) => {
    const colors = {
      APPROVED: "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100",
      PENDING: "bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100",
      REJECTED: "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100",
      default: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100",
    };
    return colors[status] || colors.default;
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900  transition-colors duration-300">
      <h2 className="text-3xl font-bold mb-6 text-blue-800 dark:text-blue-400 flex items-center gap-2">
        <FiUser /> Welcome ,{profile.name || "Delivery Person"}
      </h2>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4  shadow border-l-4 border-blue-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active Orders</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiTrendingUp /> {profile.activeOrderDeliveries || 0}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4  shadow border-l-4 border-yellow-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Active Repairs</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiTrendingUp /> {profile.activeRepairDeliveries || 0}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 shadow border-l-4 border-green-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Completed</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiCheckCircle /> {profile.totalCompletedDeliveries || 0}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4  shadow border-l-4 border-purple-500 flex flex-col items-start">
          <span className="text-sm text-gray-500 dark:text-gray-400">Account Status</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(profile.status)}`}>
            {profile.status || "UNKNOWN"}
          </span>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
        {/* Static info */}
        <div>
          <strong className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
            <FiMail /> Email
          </strong>
          <p className="text-gray-700 dark:text-gray-200 break-words">{profile.email}</p>
        </div>

        <div>
          <strong className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
            <FiClock /> Created
          </strong>
          <p className="text-gray-700 dark:text-gray-200">{formatDate(profile.createdAt)}</p>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              profile.verified ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100" : "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100"
            }`}
          >
            {profile.verified ? "Verified" : "Not Verified"}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              profile.activate ? "bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100" : "bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100"
            }`}
          >
            {profile.activate ? "Active" : "Inactive"}
          </span>
        </div>

        <hr className="border-gray-200 dark:border-gray-700 my-4" />

        {/* Editable fields */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Name</label>
          <input
            value={form.name}
            disabled={!isEditing}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full  bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Address</label>
          <input
            value={form.address}
            disabled={!isEditing}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full  bg-gray-100 dark:bg-gray-700  text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Phone</label>
          <input
            value={form.phone}
            disabled={!isEditing}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bordr bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Edit actions */}
        <div className="mt-4 flex justify-end gap-3">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Profile
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setForm({ name: profile.name, address: profile.address, phone: profile.phone });
                  setIsEditing(false);
                }}
                disabled={loading}
                className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
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