import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import { FiUser, FiTool, FiShop, FiClipboard, FiHome } from "react-icons/fi";
import Swal from "sweetalert2";
import { RiStore2Line } from "@remixicon/react";

const ReassignRepairs = () => {
  const token = localStorage.getItem("authToken");
  const [repairs, setRepairs] = useState([]);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(6);


  const fetchRepairs = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8080/api/assigner/repairs-for-assignment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch repairs");
      const data = await res.json();
      setRepairs(data.content || data || []);
    } catch (err) {
      Swal.fire("خطأ", "فشل تحميل الإصلاحات", "error");
    } finally {
      setLoading(false);
    }
  };


  const fetchDeliveryPersons = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/assigner/delivery-persons", {
        headers: { Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error("Failed to fetch delivery persons");
      const data = await res.json();
      setDeliveryPersons(data.content || data || []);
    } catch (err) {
      Swal.fire("خطأ", "فشل تحميل مندوبي التوصيل", "error");
    }
  };

 
  const reassignRepair = async (deliveryId) => {
    try {
      await fetch(`http://localhost:8080/api/assigner/reassign-order/${selectedRepair.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newDeliveryId: deliveryId, notes }),
      });
      Swal.fire("نجاح", "تم إعادة تعيين الطلب بنجاح", "success");
      setSelectedRepair(null);
      fetchRepairs(); 
    } catch (err) {
      Swal.fire("خطأ", "فشل إعادة التعيين", "error");
    }
  };

  useEffect(() => {
    fetchRepairs();
    fetchDeliveryPersons();
  }, [token]);

  const filteredRepairs = repairs.filter(
  (r) =>
    r.id.toString().includes(searchTerm) ||
    r.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.shopId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.status.toLowerCase().includes(searchTerm.toLowerCase())
);

const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentRepairs = filteredRepairs.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredRepairs.length / itemsPerPage);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex bg-white p-5 rounded-lg justify-between flex-wrap items-center">
      <h2 className="text-2xl font-bold  flex items-center gap-2 text-blue-600">
        <FiTool /> Reassign Repairs
      </h2>
      <div className="flex justify-end">
  <input
    type="text"
    placeholder="Search ..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="px-4 py-2 border bg-gray-50 rounded-3xl w-64 text-sm focus:ring focus:ring-blue-300 focus:outline-none"
  />
</div>
</div><br /><br />

      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
      ) : currentRepairs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentRepairs.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow p-5 border hover:shadow-lg transition">
              <div className="flex items-center gap-2 mb-3 text-blue-500">
                <FiClipboard /> Repair ID: {r.id}
              </div>
              <div className="space-y-1 text-gray-700 text-sm">
                <div className="flex items-center gap-2"><FiUser /> User: {r.userId}</div>
                <div className="flex items-center gap-2"><FiHome /> Shop: {r.shopId}</div>
                <div className="flex items-center gap-2"><FiTool /> Status: {r.status}</div>
              </div>
              <button
                onClick={() => setSelectedRepair(r)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded w-full hover:bg-blue-700 transition"
              >
                Reassign
              </button>
            </div>
          ))}

{totalPages > 1 && (
  <div className="flex justify-center items-center mt-6 gap-2">
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 rounded bg-blue-100 text-blue-600 disabled:opacity-50"
    >
      Prev
    </button>

    {Array.from({ length: totalPages }, (_, i) => (
      <button
        key={i}
        onClick={() => setCurrentPage(i + 1)}
        className={`px-3 py-1 rounded ${
          currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-100 text-blue-600"
        }`}
      >
        {i + 1}
      </button>
    ))}

    <button
      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
      disabled={currentPage === totalPages}
      className="px-3 py-1 rounded bg-blue-100 text-blue-600 disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}

        </div>
      ) : (
        <div className="text-center text-gray-500 py-10">No repairs for reassignment</div>
      )}

      {selectedRepair && (
        <Modal onClose={() => setSelectedRepair(null)} title="Reassign Repair">
          <textarea
            className="w-full border p-2 rounded mb-3"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <h3 className="font-semibold mb-2">Choose New Delivery Person:</h3>
          {deliveryPersons.map((d) => (
            <button
              key={d.id}
              onClick={() => reassignRepair(d.id)}
              className="block w-full px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 mb-2"
            >
              {d.name}
            </button>
          ))}
        </Modal>
      )}
    </div>
  );
};

export default ReassignRepairs;