import React, { useState, useEffect } from "react";
import {
  FiXCircle,
  FiChevronDown,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiInfo,
  FiCheckSquare,
  FiTag,
  FiTrash2,
  FiEdit2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Swal from "sweetalert2";

const ShopOffers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [newOffer, setNewOffer] = useState({
    name: "",
    description: "",
    discountValue: "",
    discountType: "PERCENTAGE",
    status: "ACTIVE",
    startDate: "",
    endDate: "",
  });

  const ordersPerPage = 5;
  const token = localStorage.getItem("authToken");

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/shop/offers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch offers");
      const data = await res.json();
      setOffers(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "فشل في تحميل العروض", "error");
    } finally {
      setLoading(false);
    }
  };

  const viewOfferDetails = async (offerId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/shop/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch offer details");
      const offer = await res.json();
    const startFormattedDate = new Date(offer.startDate).toLocaleString("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short"
      });

       const endFormattedDate = new Date(offer.endDate).toLocaleString("ar-EG", {
        dateStyle: "medium",
        timeStyle: "short"
      });
      Swal.fire({
        title:` تفاصيل العرض #${offer.id}`,
        html: `
          <div class="text-right font-cairo">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">اسم العرض</strong> ${offer.name}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الوصف</strong> ${offer.description}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">قيمة الخصم</strong> ${offer.discountValue} ${offer.discountType === "PERCENTAGE" ? "%" : "EGP"}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">نوع الخصم</strong> ${offer.discountType === "PERCENTAGE" ? "نسبة مئوية" : "مبلغ ثابت"}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">الحالة</strong> ${offer.status === "ACTIVE" ? "نشط" : offer.status === "SCHEDULED" ? "قادم" : "غير نشط"}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">تاريخ البداية</strong> ${startFormattedDate}</p><hr class="border-gray-200 dark:border-gray-700 p-1">
            <p class="flex justify-between flex-row-reverse text-indigo-600 dark:text-indigo-400"><strong class="text-gray-900 dark:text-gray-200">تاريخ النهاية</strong> ${endFormattedDate}</p>
          </div>
        `,
        width: 600,
        icon: "info",
        showCloseButton: true,
        confirmButtonText: "إغلاق",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "فشل في تحميل تفاصيل العرض", "error");
    }
  };

  const addOffer = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/shop/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newOffer, discountValue: Number(newOffer.discountValue) }),
      });
      if (!res.ok) throw new Error("Failed to add offer");

      Swal.fire("Success!", "تمت إضافة العرض بنجاح", "success");
      setNewOffer({
        name: "",
        description: "",
        discountValue: "",
        discountType: "PERCENTAGE",
        status: "ACTIVE",
        startDate: "",
        endDate: "",
      });
      fetchOffers();
    } catch (err) {
      console.error("Error adding offer:", err);
      Swal.fire("Error", "فشل في إضافة العرض", "error");
    }
  };

  const updateOffer = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shop/offers/${editingOffer.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...editingOffer, discountValue: Number(editingOffer.discountValue) }),
        }
      );
      if (!res.ok) throw new Error("Failed to update offer");

      Swal.fire("Success!", "تم تعديل العرض بنجاح", "success");
      setEditingOffer(null);
      fetchOffers();
    } catch (err) {
      console.error("Error updating offer:", err);
      Swal.fire("Error", "فشل في تعديل العرض", "error");
    }
  };

  const deleteOffer = async (offerId) => {
    Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف العرض بشكل نهائي",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      customClass: {
        popup: "dark:bg-gray-800 dark:text-white",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `http://localhost:8080/api/shop/offers/${offerId}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!res.ok) throw new Error("Failed to delete offer");

          Swal.fire({
            title: "Deleted!",
            text: "تم حذف العرض",
            icon: "success",
            customClass: {
              popup: "dark:bg-gray-800 dark:text-white",
            },
          });
          fetchOffers();
        } catch (err) {
          console.error("Error deleting offer:", err);
          Swal.fire("Error", "فشل في حذف العرض", "error");
        }
      }
    });
  };

  const filteredOffers = offers.filter((offer) =>
    offer.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOffers = filteredOffers.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / ordersPerPage));

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div style={{marginTop:"-600px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-3">
          <FiShoppingBag className="text-xl sm:text-2xl" /> عروض المتجر
        </h1>
      </div>

      
      <div className="max-w-6xl mx-auto mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-3">
            <FiTag className="text-indigo-600 dark:text-indigo-400" />
            {editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}
          </h2>
          {editingOffer && (
            <button
              onClick={() => setEditingOffer(null)}
              className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
            >
              <FiX className="text-xl" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(editingOffer ? [editingOffer] : [newOffer]).map((offer, idx) => (
            <React.Fragment key={idx}>
              <input
                type="text"
                placeholder="اسم العرض"
                value={offer.name}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({ ...editingOffer, name: e.target.value })
                    : setNewOffer({ ...newOffer, name: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
              <input
                type="text"
                placeholder="الوصف"
                value={offer.description}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({
                        ...editingOffer,
                        description: e.target.value,
                      })
                    : setNewOffer({ ...newOffer, description: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
              <input
                type="text"
                placeholder="أدخل قيمة الخصم"
                value={offer.discountValue}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({
                        ...editingOffer,
                        discountValue: e.target.value,
                      })
                    : setNewOffer({
                        ...newOffer,
                        discountValue: e.target.value,
                      })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
              <select
                value={offer.discountType}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({
                        ...editingOffer,
                        discountType: e.target.value,
                      })
                    : setNewOffer({ ...newOffer, discountType: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              >
                <option value="PERCENTAGE">نسبة مئوية</option>
                <option value="FIXED_AMOUNT">مبلغ ثابت</option>
              </select>
              <select
                value={offer.status}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({
                        ...editingOffer,
                        status: e.target.value,
                      })
                    : setNewOffer({ ...newOffer, status: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              >
                <option value="ACTIVE">نشط</option>
                <option value="SCHEDULED">قادم</option>
                <option value="EXPIRED">غير نشط</option>
              </select>
              <input
                type="datetime-local"
                value={offer.startDate}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({
                        ...editingOffer,
                        startDate: e.target.value,
                      })
                    : setNewOffer({ ...newOffer, startDate: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
              <input
                type="datetime-local"
                value={offer.endDate}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({
                        ...editingOffer,
                        endDate: e.target.value,
                      })
                    : setNewOffer({ ...newOffer, endDate: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
            </React.Fragment>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={editingOffer ? updateOffer : addOffer}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300 shadow-md"
          >
            {editingOffer ? "تعديل العرض" : "إضافة العرض"}
          </button>
          {editingOffer && (
            <button
              onClick={() => setEditingOffer(null)}
              className="px-6 py-2.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-300 shadow-md"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
            <input
              type="text"
              placeholder="ابحث عن عرض..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
            />
          </div>
        </div>
      </div>

      
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FiRefreshCw className="animate-spin text-indigo-600 dark:text-indigo-400 text-4xl" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto text-center text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">اسم العرض</th>
                      <th className="px-4 py-3 font-semibold">الوصف</th>
                      <th className="px-4 py-3 font-semibold">الحالة</th>
                      <th className="px-4 py-3 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-200">
                    {currentOffers.map((offer, index) => (
                      <tr
                        key={offer.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      >
                        <td className="px-4 py-3">{indexOfFirstOrder + index + 1}</td>
                        <td className="px-4 py-3">{offer.name}</td>
                        <td className="px-4 py-3">{offer.description}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              offer.status === "ACTIVE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : offer.status === "SCHEDULED"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {offer.status === "ACTIVE" ? "نشط" : offer.status === "SCHEDULED" ? "قادم" : "غير نشط"}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex justify-center gap-2">
                          <button
                            onClick={() => viewOfferDetails(offer.id)}
                            className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                          >
                            <FiInfo />
                          </button>
                          <button
                            onClick={() => setEditingOffer(offer)}
                            className="p-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all duration-200"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => deleteOffer(offer.id)}
                            className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                          >
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {currentOffers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center">
                          <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                            لا توجد عروض
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {searchTerm ? "حاول تعديل مصطلحات البحث" : "أضف عرضًا جديدًا لبدء إدارة العروض"}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

         
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === 1}
                  >
                    <FiChevronRight />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-300 ${
                        currentPage === page
                          ? "bg-indigo-600 text-white dark:bg-indigo-500"
                          : "bg-gray-50 dark:bg-gray-700 dark:text-white hover:bg-indigo-100 dark:hover:bg-indigo-900"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-4 py-2 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === totalPages}
                  >
                    <FiChevronLeft />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopOffers;