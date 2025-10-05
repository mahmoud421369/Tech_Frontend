import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FiTool, FiDollarSign, FiInfo, FiChevronDown, FiSearch, FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import ShopLayout from "../components/ShopLayout";
import { RiCheckLine, RiClockwiseLine } from "react-icons/ri";

const RepairRequests = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const token = localStorage.getItem("authToken");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const repairsPerPage = 10;
  const statuses = [
    "SUBMITTED",
    "QUOTE_PENDING",
    "QUOTE_SENT",
    "QUOTE_APPROVED",
    "QUOTE_REJECTED",
    "DEVICE_COLLECTED",
    "REPAIRING",
    "REPAIR_COMPLETED",
    "DEVICE_DELIVERED",
    "CANCELLED",
    "FAILED",
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "SUBMITTED": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "QUOTE_PENDING": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "REPAIRING": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "REPAIR_COMPLETED": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "DEVICE_DELIVERED": return "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-200";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "FAILED": return "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const fetchRepairs = async () => {
    try {
      setIsLoading(true);
      const url =
        statusFilter === "all"
          ? "http://localhost:8080/api/shops/repair-request"
          : `http://localhost:8080/api/shops/repair-request/status/${statusFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch repair requests");
      const data = await res.json();
      setRepairs(data.content || []);
    } catch (err) {
      console.error(err);
   Swal.fire('Error', 'Failed to fetch all orders', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const viewRepairDetails = async (repairId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/repair-request/${repairId}`,
        { headers: { Authorization: `Bearer ${token}`} }
      );
      if (!res.ok) throw new Error("Failed to fetch repair details");
      const repair = await res.json();

      Swal.fire({
        title:` تفاصيل الطلب #${repair.id}`,
        html: `
          <div class="text-right font-cairo" style="line-height: 1.8;">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">العميل</strong> ${repair.userId}</p><hr class="border-gray-100 p-1">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">الوصف</strong> ${repair.description || "N/A"}</p><hr class="border-gray-100 p-1">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">العنوان</strong> ${repair.deliveryAddress}</p><hr class="border-gray-100 p-1">
            <p class="flex justify-between flex-row-reverse"><strong class="text-blue-500">الفئة</strong> ${repair.deviceCategory}</p><hr class="border-gray-100 p-1">
          </div>
        `,
        icon: "info",
        confirmButtonText: "إغلاق",
        customClass: {
          popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "",
        },
      });
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch orders', 'error');
    }
  };

  const updateRepairPrice = async (repairId, price) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/repair-request/${repairId}/price`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ price }),
        }
      );
      if (!res.ok) throw new Error("Failed to update price");
      Swal.fire('success',`تم اضافة السعر  ${price}`,'success');
      fetchRepairs();
    } catch (err) {
      console.error(err);
      toast.error("فشل تحديث السعر");
    }
  };

  const updateRepairStatus = async (repairId, status) => {
    try {
      const res = await fetch(`http://localhost:8080/api/shops/repair-request/${repairId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success(`Status updated to ${status}`);
      fetchRepairs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update repair status");
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter]);

  const filteredRepairs = repairs.filter(
    (repair) =>
      repair.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRepair = currentPage * repairsPerPage;
  const indexOfFirstRepair = indexOfLastRepair - repairsPerPage;
  const currentRepairs = filteredRepairs.slice(indexOfFirstRepair, indexOfLastRepair);
  const totalPages = Math.ceil(filteredRepairs.length / repairsPerPage);

  return (
    <div style={{marginTop:"-600px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-indigo-600 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-indigo-600 dark:text-indigo-400">
            إجمالي طلبات التصليح <FiTool className="text-xl" />
          </h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">{repairs.length}</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800  shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-yellow-600 dark:text-yellow-400">
            طلبات معلقة <RiClockwiseLine className="text-xl" />
          </h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
            {repairs.filter((r) => r.status === "QUOTE_PENDING").length}
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <h3 className="text-lg font-semibold flex justify-end items-center gap-3 text-green-600 dark:text-green-400">
            طلبات مكتملة <RiCheckLine className="text-xl" />
          </h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2 text-right">
            {repairs.filter((r) => r.status === "DEVICE_DELIVERED").length}
          </p>
        </div>
      </div>


      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between flex-row-reverse flex-wrap gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">طلبات التصليح</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                placeholder="... ابحث في طلبات التصليح"
                className="w-full pl-10 pr-4 py-2.5 placeholder:text-right bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-300"
              >
                <span>{statusFilter === "all" ? "حالة الطلب" : statusFilter.replace("_", " ")}</span>
                <FiChevronDown className={`transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {["all", ...statuses].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-right text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      {s === "all" ? "الكل" : s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

     
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-center text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">العميل</th>
                      <th className="px-4 py-3 font-semibold">الوصف</th>
                      <th className="px-4 py-3 font-semibold">الحالة</th>
                      <th className="px-4 py-3 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {currentRepairs.map((r, i) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <td className="px-4 py-3">{indexOfFirstRepair + i + 1}</td>
                        <td className="px-4 py-3">{r.userId}</td>
                        <td className="px-4 py-3">{r.description || "N/A"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.status)}`}>
                            {r.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex justify-center gap-2">
                          <select
                            value={r.status}
                            onChange={(e) => updateRepairStatus(r.id, e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold transition-all duration-300"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => viewRepairDetails(r.id)}
                            className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                          >
                            <FiInfo />
                          </button>
                          <button
                            onClick={() =>
                              Swal.fire({
                                title: "أدخل السعر الجديد",
                                input: "number",
                                inputValue: r.price || "",
                                showCancelButton: true,
                                confirmButtonText: "تحديث",
                                preConfirm: (value) => updateRepairPrice(r.id, value),
                                customClass: {
                                  popup: darkMode ? "dark:bg-gray-800 dark:text-white" : "",
                                },
                              })
                            }
                            className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200"
                          >
                            <FiDollarSign />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {currentRepairs.length === 0 && (
                <div className="p-8 text-center bg-white dark:bg-gray-800">
                  <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    {repairs.length === 0 ? "لا توجد طلبات تصليح" : "لم يتم العثور على طلبات"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? "حاول تعديل مصطلحات البحث" : "جميع الطلبات تم تخصيصها أو لا توجد طلبات معلقة"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

       
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => changePage(currentPage - 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              <FiChevronRight />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => changePage(i + 1)}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white dark:bg-indigo-500"
                    : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => changePage(currentPage + 1)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              <FiChevronLeft />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairRequests;