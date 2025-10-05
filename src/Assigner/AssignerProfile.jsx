import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const AssignerProfile = () => {
  const token = localStorage.getItem("authToken");
  const [profile, setProfile] = useState({});
  const [form, setForm] = useState({ 
    name: "", 
    department: "", 
    phone: "" 
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8080/api/assigner/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data = await response.json();
      setProfile(data);
      setForm({ 
        name: data.name || "", 
        department: data.department || "", 
        phone: data.phone || "" 
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load profile data",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
    setIsLoading(true);
    const response = await fetch("http://localhost:8080/api/assigner/profile", {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) throw new Error("Failed to update profile");


    const contentType = response.headers.get("content-type");
    let updatedProfile = profile; // fallback
    if (contentType && contentType.includes("application/json")) {
      updatedProfile = await response.json();
      setProfile(updatedProfile);
    }

    await Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Profile updated successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    setIsEditing(false);
  } catch (error) {
    console.error("Error updating profile:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to update profile",
    });
  } finally {
    setIsLoading(false);
  }
};

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const getStatusBadge = (status) => {
    const statusColors = {
      APPROVED: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      REJECTED: "bg-red-100 text-red-800",
      default: "bg-gray-100 text-gray-800"
    };
    return statusColors[status] || statusColors.default;
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleCancel = () => {
    setForm({ 
      name: profile.name || "", 
      department: profile.department || "", 
      phone: profile.phone || "" 
    });
    setIsEditing(false);
  };

  if (isLoading && !profile.id) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

   

  return (
    <div className="p-6 max-w-8xl bg-gray-50  dark:bg-gray-900  w-full space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h2>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4  shadow border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile.totalAssignmentsHandled || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4  shadow border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Assignments</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile.pendingAssignments || 0}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4  shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(profile.status)}`}>
            {profile.status || "UNKNOWN"}
          </span>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4  shadow border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Activity</h3>
          {/* <p className="text-sm text-gray-900 dark:text-white">
            {formatDate(profile.lastActivity)}
          </p> */}
        </div>
      </div>

    
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Profile Information</h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-indigo-50 border-indigo-100 text-indigo-600 border-2  px-4 py-2 rounded-md dark:bg-black/70 dark:border-gray-700 dark:text-gray-300 hover:bg-indigo-100 hover:text-indigo-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
       
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {profile.email || "N/A"}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigner ID</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {profile.id || "N/A"}
              </p>
            </div>
          </div>

   
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {profile.name || "N/A"}
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
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {profile.department || "N/A"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  0{profile.phone || "N/A"}
                </p>
              )}
            </div>
          </div>

       
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {formatDate(profile.createdAt)}
              </p>
            </div>
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {formatDate(profile.updatedAt)}
              </p>
            </div> */}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
              <div className="mt-1 flex items-center space-x-2">
                {/* <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(profile.status)}`}>
                  {profile.status || "UNKNOWN"}
                </span> */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profile.verified ? 'Verified' : 'Not Verified'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.activate ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {profile.activate ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          
          {isEditing && (
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleUpdate}
                disabled={isLoading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Save Changes"}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignerProfile;