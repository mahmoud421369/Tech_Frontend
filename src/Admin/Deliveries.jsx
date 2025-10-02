import { RiTruckLine } from "@remixicon/react";
import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiInfo, FiTrash2, FiXCircle } from "react-icons/fi";

const API_BASE = "http://localhost:8080/api/admin/deliveries";

const Deliveries= () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);


  const fetchDeliveries = async () => {
    setLoading(true);
    setError("");

    let url = API_BASE;
    if (filter !== "all") url += `/${filter}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      const data = await res.json();
      setDeliveries(data.content || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [filter]);

  const fetchDeliveryById = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch delivery details");
      const data = await res.json();
      setSelectedDelivery(data);
    } catch (err) {
      alert(err.message);
    }
  };


  const updateStatus = async (id, action) => {
    let url = `${API_BASE}/${id}/${action}`;
    let method = action === "delete" ? "DELETE" : "PUT";

    try {
      const res = await fetch(url, { method });
      if (!res.ok) throw new Error(`Failed to ${action} delivery`);
      fetchDeliveries();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{marginTop:"60px"}}
      className="space-y-6 p-6 max-w-8xl min-h-screen w-full mx-auto dark:bg-gray-900 bg-gray-50">
    <div className= " bg-white dark:bg-gray-800 dark:border-gray-700 border p-4 rounded-2xl text-left">
            <h1 className="text-3xl font-bold text-blue-500 flex items-center gap-2"><RiTruckLine/>Delivery Management</h1>
            <p className="text-blue-500">Monitor and manage delivery details</p>
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

    
      <div className="overflow-x-auto bg-white ">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-blue-500 dark:bg-gray-800 dark:text-gray-200">
            <tr>
              <th className="px-6 py-3 text-center font-medium uppercase">Name</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Email</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Phone</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Status</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Completed</th>
              <th className="px-6 py-3 text-center font-medium uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 text-blue-500 dark:bg-gray-900 dark:text-gray-200">
            {deliveries.length === 0 && !loading && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-4 text-center text-gray-500"
                >
                  No deliveries found
                </td>
              </tr>
            )}
            {deliveries.map((d) => (
              <tr key={d.id} className="text-center border-b dark:border-gray-700">
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3">{d.email}</td>
                <td className="px-4 py-3">0{d.phone}</td>
                 <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      d.status === "APPROVED"
                        ? "bg-green-100 dark:bg-gray-950 text-green-700"
                        : d.status === "PENDING"
                        ? "bg-yellow-100 dark:bg-gray-950 text-yellow-700"
                        : "bg-red-100 dark:bg-gray-950 text-red-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3">{d.totalCompletedDeliveries}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => fetchDeliveryById(d.id)}
                    className="border dark:bg-gray-950 dark:border-none text-blue-600 px-3 py-1 rounded-3xl"
                  >
                    <FiInfo/>
                  </button>
                  {d.status !== "APPROVED" && (
                    <button
                      onClick={() => updateStatus(d.id, "approve")}
                      className="border dark:bg-gray-950 dark:border-none text-green-600 px-3 py-1 rounded-3xl"
                    >
                      <FiCheckCircle/>
                    </button>
                  )}
                  {d.status !== "SUSPENDED" && (
                    <button
                      onClick={() => updateStatus(d.id, "suspend")}
                      className="border dark:bg-gray-950 dark:border-none text-amber-600 px-3 py-1 rounded-3xl"
                    >
                      <FiXCircle/>
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(d.id, "delete")}
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

      {selectedDelivery && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
            <h2 className="text-xl font-bold text-blue-700 mb-4">
              Delivery Details
            </h2>
            <p>
              <strong>Name:</strong> {selectedDelivery.name}
            </p>
            <p>
              <strong>Email:</strong> {selectedDelivery.email}
            </p>
            <p>
              <strong>Phone:</strong> {selectedDelivery.phone}
            </p>
            <p>
              <strong>Address:</strong> {selectedDelivery.address}
            </p>
            <p>
              <strong>Status:</strong> {selectedDelivery.status}
            </p>
            <p>
              <strong>Active Orders:</strong>{" "}
              {selectedDelivery.activeOrderDeliveries}
            </p>
            <p>
              <strong>Active Repairs:</strong>{" "}
              {selectedDelivery.activeRepairDeliveries}
            </p>
            <p>
              <strong>Completed:</strong>{" "}
              {selectedDelivery.totalCompletedDeliveries}
            </p>
            <button
              onClick={() => setSelectedDelivery(null)}
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

export default Deliveries;