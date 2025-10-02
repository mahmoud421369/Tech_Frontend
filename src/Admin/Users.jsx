import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [roleUpdates, setRoleUpdates] = useState({});

 
  const fetchUsers = async (page = 0) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/users?page=${page}&size=5`
      );
      const data = await res.json();
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };


  const getUserById = async (id) => {
    try {
      const res = await fetch(`http://localhost:8080/api/admin/users/${id}`);
      if (res.ok) {
        const user = await res.json();
        Swal.fire({
          title: `User Details - ${user.firstName} ${user.lastName}`,
          html: `
            <p class="text-left"><strong>ID:</strong> ${user.id}</p>
            <p class="text-left"><strong>Email:</strong> ${user.email}</p>
            <p class="text-left"><strong>Role:</strong> ${user.role}</p>
            <p class="text-left"><strong>Status:</strong> ${
              user.activate === true ? "Active " : "Inactive "
            }</p>
          `,
          icon: "info",
          confirmButtonText: "Close",
          confirmButtonColor: "#374151",
        });
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };


  const activateUser = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/users/${id}/activate`,
        { method: "PUT" }
      );
      if (res.ok) {
        Swal.fire("Activated!", "User has been activated.", "success");
        fetchUsers(currentPage);
      }
    } catch (err) {
      console.error("Error activating user:", err);
    }
  };

 
  const deactivateUser = async (id) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/admin/users/${id}/deactivate`,
        { method: "PUT" }
      );
      if (res.ok) {
        Swal.fire("Deactivated!", "User has been deactivated.", "warning");
        fetchUsers(currentPage);
      }
    } catch (err) {
      console.error("Error deactivating user:", err);
    }
  };

 const updateRole = async (id, role) => {
  try {
    const res = await fetch(`http://localhost:8080/api/admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    if (res.ok) {
      Swal.fire("Updated!", `User role updated to ${role}.`, "success");
      fetchUsers(currentPage);
    } else {
      const errMsg = await res.text();
      Swal.fire("Error", errMsg || "Failed to update role", "error");
    }
  } catch (err) {
    console.error("Error updating role:", err);
    Swal.fire("Error", "Something went wrong!", "error");
  }
};

  // 🔹 Delete User
  // const deleteUser = async (id) => {
  //   Swal.fire({
  //     title: "Are you sure?",
  //     text: "You won’t be able to revert this!",
  //     icon: "warning",
  //     showCancelButton: true,
  //     confirmButtonColor: "#d33",
  //     cancelButtonColor: "#374151",
  //     confirmButtonText: "Yes, delete it!",
  //   }).then(async (result) => {
  //     if (result.isConfirmed) {
  //       try {
  //         const res = await fetch(
  //          `http://localhost:8080/api/admin/users/${id}`,
  //           { method: "DELETE" }
  //         );
  //         if (res.ok) {
  //           setUsers((prev) => prev.filter((user) => user.id !== id));
  //           Swal.fire("Deleted!", "User has been deleted.", "success");
  //         }
  //       } catch (err) {
  //         console.error("Error deleting user:", err);
  //       }
  //     }
  //   });
  // };


  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
        <div style={{ marginTop:"60px"}}  className="flex-1  p-6 bg-[#f1f5f9] dark:bg-gray-900 min-h-screen transition-colors duration-300">

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 rounded-2xl text-left mb-4 shadow">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-500 flex items-center gap-2">
          <FiUsers /> Users Management
        </h1>
        <p className="text-blue-500 text-sm md:text-base">
          Monitor and manage your users, activate, deactivate, and change user role
        </p>
      </div>


      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full md:w-1/2 pl-4 pr-3 py-3 rounded-xl 
              bg-[#ECF0F3] dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
              focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 text-blue-500">
                <tr>
                  <th className="px-6 py-3 text-center font-medium uppercase">Name</th>
                  <th className="px-6 py-3 text-center font-medium uppercase">Email</th>
                  <th className="px-6 py-3 text-center font-medium uppercase">Role</th>
                  <th className="px-6 py-3 text-center font-medium uppercase">Status</th>
                  <th className="px-6 py-3 text-center font-medium uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50 dark:bg-gray-900 text-center">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="border-b border-blue-100 dark:border-gray-700 text-sm text-blue-500 px-3 py-2">
                        {user.firstName} {user.lastName}
                      </td>
                      <td className="border-b border-blue-100 dark:border-gray-700 text-sm text-blue-500 px-3 py-2">
                        {user.email}
                      </td>
                      <td className="border-b border-blue-100 dark:border-gray-700 flex gap-2 text-sm text-blue-500 px-3 py-4">
                        <select
                          value={roleUpdates[user.id] || user.role}
                          onChange={(e) =>
                            setRoleUpdates((prev) => ({
                              ...prev,
                              [user.id]: e.target.value,
                            }))
                          }
                          className="border rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        >
                          <option value="GUEST">USER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SHOP_OWNER">SHOP_OWNER</option>
                        </select>
                        <button
                          onClick={() =>
                            updateRole(user.id, roleUpdates[user.id] || user.role)
                          }
                          className="ml-2 bg-indigo-50 dark:bg-indigo-900 dark:text-white text-indigo-500 border font-semibold text-sm border-indigo-200 dark:border-indigo-700 px-3 py-1 rounded-2xl"
                        >
                          Save
                        </button>
                      </td>
                      <td className="border-b border-gray-100 dark:border-gray-800 text-sm text-center text-blue-500 px-3 py-2">
                        {user.activate ? (
                          <div className="flex justify-center items-center ">
                          <FiCheckCircle
                            size={30}
                            className="bg-green-400 text-white p-2 rounded-full"
                          />
                          </div>
                        ) : (
                          <div className="flex justify-center items-center ">
                          <FiXCircle
                            size={30}
                            className="bg-red-400 text-white p-2 rounded-full"
                          />
                          </div>
                        )}
                      </td>
                      <td className="border-b border-blue-100 dark:border-gray-700 text-sm text-blue-500 px-3 py-2 flex justify-center gap-2 mt-2">
                        {!user.activate ? (
                          <button
                            onClick={() => activateUser(user.id)}
                            className="bg-emerald-50 dark:bg-emerald-900 text-emerald-500 border font-semibold text-sm border-emerald-200 dark:border-emerald-700 px-3 py-2 rounded-3xl"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => deactivateUser(user.id)}
                            className="bg-amber-50 dark:bg-amber-900 text-amber-500 border font-semibold text-sm border-amber-200 dark:border-amber-700 px-3 py-2 rounded-3xl"
                          >
                            Deactivate
                          </button>
                        )}

                        <button
                          onClick={() => getUserById(user.id)}
                          className="bg-gray-50 dark:bg-gray-700 text-gray-500 border font-semibold text-sm border-gray-200 dark:border-gray-600 px-3 py-2 rounded-3xl"
                        >
                          <FiEye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-4 text-gray-500 dark:text-gray-400 italic"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

   
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => fetchUsers(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 disabled:opacity-50"
        >
          <FiChevronLeft />
        </button>
        <span className="text-gray-700 dark:text-gray-300">
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => fetchUsers(currentPage + 1)}
          disabled={currentPage + 1 >= totalPages}
          className="px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 disabled:opacity-50"
        >
          <FiChevronRight />
        </button>
      </div>
    </div>

  );
};

export default Users;