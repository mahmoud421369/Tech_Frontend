import { RiInfoI } from "@remixicon/react";
import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiInfo, FiTrash2, FiXOctagon } from "react-icons/fi";
import { RiGift2Line } from "react-icons/ri";

const API_BASE = "http://localhost:8080/api/admin/assigners";

const Assigners = () => {
  const [assigners, setAssigners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedAssigner, setSelectedAssigner] = useState(null);

  
  const fetchAssigners = async () => {
    setLoading(true);
    setError("");

    let url = API_BASE;
    if (filter !== "all") url += `/${filter}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch assigners");
      const data = await res.json();
      setAssigners(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssigners();
  }, [filter]);


  const fetchAssignerById = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch assigner details");
      const data = await res.json();
      setSelectedAssigner(data);
    } catch (err) {
      alert(err.message);
    }
  };

  
  const updateStatus = async (id, action) => {
    let url = `${API_BASE}/${id}/${action}`;
    let method = action === "delete" ? "DELETE" : "PUT";

    try {
      const res = await fetch(url, { method });
      if (!res.ok) throw new Error(`Failed to ${action} assigner`);
      fetchAssigners();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{marginTop:"60px"}}
      className="space-y-6 p-6 max-w-8xl min-h-screen w-full mx-auto dark:bg-gray-900 bg-gray-50">
        <div className= " bg-white dark:bg-gray-800 dark:border-gray-700 border p-4 rounded-2xl text-left" >
                <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2"><RiGift2Line/>Assigners Management</h1>
                <p className="text-blue-500">Monitor and manage Assigner details</p>
              </div>
    
      <div className="flex space-x-4 mb-6">
        {["all", "pending", "approved", "suspended"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === f
                ? "bg-blue-600 dark:bg-gray-800 text-white"
                : "bg-white dark:bg-gray-950 dark:border-gray-700 text-blue-600 border border-blue-300"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      
      {loading && <p className="text-blue-600">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

     
      <div className="bg-white overflow-x-auto bg-white ">
        <table className="w-full text-sm text-center">
          <thead className="bg-[#f1f5f9] dark:bg-gray-700 dark:text-white text-blue-500">
            <tr>
              <th className="px-6 py-3 text-center font-medium uppercase">Name</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Email</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Phone</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Status</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Created At</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-blue-500 dark:bg-gray-900 dark:text-gray-200">
            {assigners.length === 0 && !loading && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-4 text-center text-gray-500"
                >
                  No assigners found
                </td>
              </tr>
            )}
            {assigners.map((a) => (
              <tr key={a.id} className="text-center border-b dark:border-gray-700">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3">{a.email}</td>
                <td className="px-4 py-3">0{a.phone}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      a.status === "APPROVED"
                        ? "bg-green-100 dark:bg-gray-950  text-green-700"
                        : a.status === "PENDING"
                        ? "bg-yellow-100 dark:bg-gray-950 text-yellow-700"
                        : "bg-red-100 dark:bg-gray-950 text-red-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => fetchAssignerById(a.id)}
                    className="border dark:bg-gray-950 dark:border-none text-blue-600 px-3 py-1 rounded-3xl"
                  >
                    <FiInfo/>
                  </button>
                  {a.status !== "APPROVED" && (
                    <button
                      onClick={() => updateStatus(a.id, "approve")}
                      className="border dark:bg-gray-950 dark:border-none text-green-600 px-3 py-1 rounded-3xl"
                    >
                      <FiCheckCircle/>
                    </button>
                  )}
                  {a.status !== "SUSPENDED" && (
                    <button
                      onClick={() => updateStatus(a.id, "suspend")}
                      className="border dark:bg-gray-950 dark:border-none text-amber-600 px-3 py-1 rounded-3xl"
                    >
                      <FiXOctagon/>
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(a.id, "delete")}
                    className="border dark:bg-gray-950 dark:border-none text-red-600 px-3 py-1 rounded-3xl"
                  >
                    <FiTrash2/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
      {selectedAssigner && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <h2 className="text-xl font-bold text-blue-700 mb-4">
              Assigner Details
            </h2>
            <p>
              <strong>Name:</strong> {selectedAssigner.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedAssigner.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedAssigner.phone}
            </p>
            <p>
              <strong>Status:</strong> {selectedAssigner.status}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(selectedAssigner.createdAt).toLocaleString()}
            </p>
            <button
              onClick={() => setSelectedAssigner(null)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assigners;