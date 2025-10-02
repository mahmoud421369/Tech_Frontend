import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCcw,
  FiTruck,
  FiClock,
  FiActivity,
  FiArchive,
  FiBell,
  FiInfo,
} from "react-icons/fi";
import Swal from "sweetalert2";

const DeliveryPersons = () => {
  const token = localStorage.getItem("authToken");
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
const [searchTerm, setSearchTerm] = useState("");




  const fetchDeliveryPersons = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:8080/api/assigner/delivery-persons",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch delivery persons");

      const data = await res.json();
      return data.content || [];
    } catch (err) {
      Swal.fire("خطأ", "فشل تحميل مندوبي التوصيل", "error");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPersons = async () => {
      const result = await fetchDeliveryPersons();
      if (isMounted) {
        setPersons(result);
      }
    };

    loadPersons();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

const filteredPersons = persons.filter(
  (p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone.includes(searchTerm)
);

const currentPersons = filteredPersons.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);
  return (
    <div className="text-right p-6 dark:bg-gray-900">
      <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-2xl max-w-8xl mx-auto shadow-md mt-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 dark:border-none border p-4 rounded-2xl mb-6 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-blue-500 flex items-center justify-center gap-2">
            <FiTruck />
           Delivery Persons
          </h2>
          <div className=" flex justify-end">
  <input
    type="text"
    placeholder="Search ..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="px-4 py-2 bg-gray-50 dark:border-none dark:bg-gray-900 border rounded-3xl w-64 text-sm focus:ring focus:ring-blue-300 focus:outline-none"
  />
</div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FiRefreshCcw className="animate-spin text-blue-500 text-2xl" />
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            {currentPersons.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPersons.map((person, idx) => (
                  <div
                    key={person.id}
                    className="bg-white dark:bg-gray-900 dark:border-none rounded-2xl shadow p-5 border border-gray-200 hover:shadow-lg transition"
                  >
                    {/* Name & Email */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-blue-400" />
                        <span className="font-semibold text-blue-900 dark:text-white">
                          {person.name}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          person.activate
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {person.activate ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 space-y-2 dark:text-blue-600">
                           <div className="flex items-center gap-2">
                        <FiInfo className="text-blue-400" /> {person.id}
                      </div>
                      <div className="flex items-center gap-2">
                        <FiMail className="text-blue-400" /> {person.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <FiPhone className="text-blue-400" /> {person.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-blue-400" /> {person.address}
                      </div>
                      <div className="flex items-center gap-2">
                        {person.verified ? (
                          <FiCheckCircle className="text-green-500" />
                        ) : (
                          <FiXCircle className="text-red-500" />
                        )}
                        {person.verified ? "Verified" : "Not Verified"}
                      </div>
                      <div className="flex items-center gap-2">
                        <FiActivity className="text-blue-400" /> Status:{" "}
                        <span className="font-medium text-blue-600">
                          {person.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FiClock className="text-blue-400" /> Created:{" "}
                        {new Date(person.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <FiClock className="text-blue-400" /> Updated:{" "}
                        {new Date(person.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <FiBell className="text-blue-400" /> Notifications:{" "}
                        {person.notificationHistory || "No history"}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 border-t dark:border-gray-800 pt-3 text-xs text-gray-600 dark:text-indigo-600 space-y-2">
                      <div className="flex justify-between">
                        <span>Active Assignments:</span>
                        <span className="font-semibold text-blue-700">
                          {person.activeAssignments}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Repairs:</span>
                        <span className="font-semibold text-blue-700">
                          {person.activeRepairDeliveries}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Deliveries:</span>
                        <span className="font-semibold text-green-700">
                          {person.totalCompletedDeliveries}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                لا توجد بيانات
              </div>
            )}

            {/* Pagination */}
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
                      currentPage === i + 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-blue-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-blue-100 text-blue-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeliveryPersons;