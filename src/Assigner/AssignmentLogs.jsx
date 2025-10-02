import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { FiClipboard, FiClock, FiInfo } from "react-icons/fi";

const AssignmentLogs = () => {
  const token = localStorage.getItem("authToken");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

const fetchLogs = async () => {
  try {
    setLoading(true);
    const res = await fetch("http://localhost:8080/api/assigner/assignment-log", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch logs");

    const data = await res.json();
    setLogs(Array.isArray(data.content) ? data.content : []);
  } catch (err) {
    Swal.fire("خطأ", "فشل تحميل السجلات", "error");
    setLogs([]);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    let isMounted = true;

    const loadLogs = async () => {
      const result = await fetchLogs();
      if (isMounted) setLogs(result);
    };

    loadLogs();
    return () => {
      isMounted = false;
    };
  }, [token]);

const logsArray = Array.isArray(logs) ? logs : [];
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentLogs = logsArray.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(logsArray.length / itemsPerPage);

  return (
    <div className="p-6 text-right">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-600">
        <FiClipboard /> Assignment Logs
      </h2>

      {loading ? (
        <div className="text-center text-blue-500">Loading...</div>
      ) : currentLogs.length > 0 ? (
        <>
          {/* ✅ Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentLogs.map((log, i) => (
              <div
                key={i}
                className="p-5 bg-white dark:bg-gray-800 shadow rounded-xl border hover:shadow-lg transition"
              >
                <div className="flex items-center gap-2 mb-3 text-blue-500">
                  <FiInfo />
                  <span className="font-semibold">Log Message</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  {log.message}
                </p>
                <div className="flex items-center gap-2 mt-4 text-gray-500 text-xs">
                  <FiClock />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Pagination */}
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
      ) : (
        <div className="text-gray-500 text-center py-10">لا توجد سجلات</div>
      )}
    </div>
  );
};

export default AssignmentLogs;