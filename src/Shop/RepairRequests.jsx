
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FiTool, FiDollarSign, FiInfo, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import ShopLayout from "../components/ShopLayout";


const RepairRequests = () => {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const token = localStorage.getItem("authToken");


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
      case "SUBMITTED": return "bg-blue-100 text-blue-800";
      case "QUOTE_PENDING": return "bg-yellow-100 text-yellow-800";
      case "REPAIRING": return "bg-orange-100 text-orange-800";
      case "REPAIR_COMPLETED": return "bg-green-100 text-green-800";
      case "DEVICE_DELIVERED": return "bg-green-200 text-green-900";
      case "CANCELLED": return "bg-red-100 text-red-800";
      case "FAILED": return "bg-red-200 text-red-900";
      default: return "bg-gray-100 text-gray-800";
    }
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
      toast.error("Error fetching repair requests");
    } finally {
      setIsLoading(false);
    }
  };

  const viewRepairDetails = async (repairId) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/repair-request/${repairId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch repair details");
      const repair = await res.json();

      Swal.fire({
        title:` تفاصيل الطلب #${repair.id}`,
        html: `
          <p class="flex justify-between">${repair.userId}<strong class="text-blue-500">العميل</strong> </p><hr class="border-gray-100 p-1">
          <p class="flex justify-between"> ${repair.description || "N/A"}<strong class="text-blue-500">الوصف</strong></p><hr class="border-gray-100 p-1">
          <p class="flex justify-between">${repair.deliveryAddress}<strong class="text-blue-500">العنوان</strong> </p><hr class="border-gray-100 p-1">
          <p class="flex justify-between">${repair.deviceCategory}<strong class="text-blue-500">الفئة</strong></p><hr class="border-gray-100 p-1">
        `,
        icon: "info",
        confirmButtonText: "إغلاق",
      });
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل تفاصيل الطلب");
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
      toast.success(`تم تحديث السعر إلى ${price}`);
      fetchRepairs();
    } catch (err) {
      console.error(err);
      toast.error("فشل تحديث السعر");
    }
  };
 const updateRepairStatus = async (repairId, status) => {
    try {
      const res = await fetch(`http://localhost:8080/api/shops/repair-request/${repairId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Status updated to ${status}`);
      fetchRepairs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update repair status');
    }
  };



  useEffect(() => {
    fetchRepairs();
  }, [statusFilter]);

  return (
     <ShopLayout>

    <div style={{marginTop:"-1200px"}}  className=" bg-[#f1f5f9] p-6 font-cairo text-right">
      

      <div className="bg-white border p-4 rounded-2xl mb-4 text-right">
        <h1 className="text-3xl font-bold text-blue-500 flex justify-end items-center gap-2">
          <FiTool /> طلبات التصليح
        </h1>
      </div>














      <div className="bg-white p-6 rounded-2xl max-w-5xl mx-auto mb-8 shadow-md">
        <label className="block mb-2 text-gray-700 font-bold">تصفية حسب الحالة</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#ECF0F3] appearance-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">الكل</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

    
      <div className="bg-white p-6 rounded-2xl max-w-6xl mx-auto shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-700 text-center">
          قائمة الطلبات
        </h2>

        {isLoading ? (
          <p className="text-center text-blue-500">جار التحميل...</p>
        ) : (
          <table className="min-w-full table-auto text-center border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-[#f1f5f9] text-blue-500">
              <tr>
                <th className="px-4 py-2">العميل</th>
                <th className="px-4 py-2">العطل</th>
                <th className="px-4 py-2">الحالة</th>
                
                <th className="px-4 py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-gray-50">
              {repairs.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50 transition text-blue-950">
                  <td className="px-4 py-2">{r.userId}</td>
                  <td className="px-4 py-2">{r.description}</td>
                  <td className="px-4 py-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.status)}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                 
                  <td className="px-4 py-2 flex justify-center gap-2">
                    <select
    value={r.status}
    onChange={(e) => updateRepairStatus(r.id, e.target.value)}
    className="px-3 py-1 rounded-lg text-sm font-semibold border focus:ring-2 focus:ring-blue-500"
  >
    {statuses.map((s) => (
      <option key={s} value={s}>
        {s.replace("_", " ")}
      </option>
    ))}
  </select>

                    <button
                      onClick={() => viewRepairDetails(r.id)}
                      className="bg-amber-100 text-amber-600 px-2 py-1 rounded-md hover:bg-amber-200 transition"
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
                        })
                      }
                      className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-200 transition"
                    >
                      <FiDollarSign />
                    </button>
                  </td>
                </tr>
              ))}
              {repairs.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-gray-500 text-center">
                    لا توجد طلبات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </ShopLayout>
  );
};

export default RepairRequests;