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
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Status:</strong> ${
              user.active ? "Active " : "Inactive "
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
    <div style={{ marginLeft: "300px", marginTop: "-575px" }} className="p-6 bg-[#f1f5f9]">
   <div className="bg-white border p-4 rounded-2xl text-left mb-4">
              <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2"><FiUsers/>Users Managament </h1>
              <p className="text-blue-500">Monitor and manage your users,activate,deactivate,and change user role</p>
            </div>

   
      <div className="bg-white p-5 rounded-lg">
      <div className="flex items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full pl-4 pr-3 py-3 rounded-xl bg-[#ECF0F3] border focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
        />
      </div>

      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 text-sm ">
          <thead className="bg-gray-100 text-blue-500">
            <tr>
              {/* <th className="px-6 py-3 text-left font-medium uppercase">ID</th> */}
              <th className="px-6 py-3 text-left font-medium uppercase">Name</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Email</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Role</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Status</th>
              <th className="px-6 py-3 text-left font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-center">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  {/* <td className="border-b border-blue-100 text-sm text-blue-500 px-3 py-2">
                    {user.id}
                  </td> */}
                  <td className="border-b border-blue-100 text-sm text-blue-500 px-3 py-2">
                    {user.firstName} {user.lastName}
                  </td>
                  <td className="border-b border-blue-100 text-sm text-blue-500 px-3 py-2">
                    {user.email}
                  </td>
                  <td className="border-b border-blue-100 flex gap-2 text-sm text-blue-500 px-3 py-4">
                    <select
                      value={roleUpdates[user.id] || user.role}
                      onChange={(e) =>
                        setRoleUpdates((prev) => ({
                          ...prev,
                          [user.id]: e.target.value,
                        }))
                      }
                      className="border rounded-lg px-2 py-1 text-sm"
                    >
                      <option value="GUEST">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SHOP_OWNER">SHOP_OWNER</option>
                     
                    </select>
                    <button
                      onClick={() =>
                        updateRole(user.id, roleUpdates[user.id] || user.role)
                      }
                      className="ml-2 bg-indigo-50 text-indigo-500 border font-semibold text-sm border-indigo-200 px-3 py-1 rounded-2xl"
                    >
                      Save
                    </button>
                  </td>
                  <td className="border-b border-blue-100 text-sm text-center text-blue-500 px-3 py-2">
                    {user.activate  ? (
                      <FiCheckCircle
                        size={30}
                        className="bg-green-400 text-white p-2 rounded-full"
                      />
                    ) : (
                      <FiXCircle
                        size={30}
                        className="bg-red-400 text-white p-2 rounded-full"
                      />
                    )}
                  </td>
                  <td className="border-b border-blue-100 text-sm text-blue-500 px-3 py-2 flex justify-center  text-center gap-2">
                    {!user.activate ? (
                      <button
                        onClick={() => activateUser(user.id)}
                        className="bg-emerald-50 text-emerald-500 border font-semibold text-sm border-emerald-200 px-3 py-2 rounded-3xl"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => deactivateUser(user.id)}
                        className="bg-amber-50 text-amber-500 border font-semibold text-sm border-amber-200 px-3 py-2 rounded-3xl"
                      >
                        Deactivate
                      </button>
                    )}

                    <button
                      onClick={() => getUserById(user.id)}
                      className="bg-gray-50 text-gray-500 border font-semibold text-sm border-gray-200 px-3 py-2 rounded-3xl"
                    >
                      <FiEye size={15} />
                    </button>

                    {/* <button
                      onClick={() => deleteUser(user.id)}
                      className="bg-red-50 text-red-500 border font-semibold text-sm border-red-200 px-3 py-2 rounded-3xl"
                    >
                      <FiTrash2 size={15} />
                    </button> */}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 text-gray-500 italic"
                >
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      </div>

    
      <div className="flex justify-center items-center gap-3 mt-6">
        <button
          onClick={() => fetchUsers(currentPage - 1)}
          disabled={currentPage === 0}
          className="px-4 py-2 rounded-lg bg-white text-blue-600 disabled:opacity-50"
        >
          <FiChevronLeft/>
        </button>
        <span>
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          onClick={() => fetchUsers(currentPage + 1)}
          disabled={currentPage + 1 >= totalPages}
          className="px-4 py-2 rounded-lg bg-white text-blue-600 disabled:opacity-50"
        >
          <FiChevronRight/>
        </button>
      </div>
    </div>
  );
};

export default Users;