
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
    discountValue: 0,
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

      Swal.fire({
        title:` تفاصيل العرض #${offer.id}`,
        html: `
          <div class="text-right font-cairo">
            <p><strong>اسم العرض:</strong> ${offer.name}</p>
            <p><strong>الوصف:</strong> ${offer.description}</p>
            <p><strong>قيمة الخصم:</strong> ${offer.discountValue}</p>
            <p><strong>نوع الخصم:</strong> ${offer.discountType}</p>
            <p><strong>الحالة:</strong> ${offer.status}</p>
            <p><strong>تاريخ البداية:</strong> ${offer.startDate}</p>
            <p><strong>تاريخ النهاية:</strong> ${offer.endDate}</p>
          </div>
        `,
        icon: "info",
        confirmButtonText: "إغلاق",
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
        body: JSON.stringify(newOffer),
      });
      if (!res.ok) throw new Error("Failed to add offer");

      Swal.fire("Success!", "تمت إضافة العرض بنجاح", "success");
      setNewOffer({
        name: "",
        description: "",
        discountValue: 0,
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
          body: JSON.stringify(editingOffer),
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

          Swal.fire("Deleted!", "تم حذف العرض", "success");
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
  const totalPages = Math.ceil(filteredOffers.length / ordersPerPage);

  useEffect(() => {
    fetchOffers();
  }, []);

  return (
    <div style={{marginTop:"-500px",marginLeft:"275px"}} className="min-h-screen bg-[#f1f5f9] p-6 font-cairo text-right">
      <div className="bg-white border p-4 rounded-2xl mb-4">
        <h1 className="text-3xl font-bold text-blue-500 flex justify-end items-center gap-2">
          عروض المتجر <FiShoppingBag />
        </h1>
      </div>

    
      <div className="bg-white p-6 rounded-2xl max-w-5xl mx-auto mb-8 shadow-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center gap-3">
          <FiTag size={28} className="text-indigo-500" />
          {editingOffer ? "تعديل العرض" : "إضافة عرض جديد"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="قيمة الخصم"
                value={offer.discountValue}
                onChange={(e) =>
                  editingOffer
                    ? setEditingOffer({
                        ...editingOffer,
                        discountValue: Number(e.target.value),
                      })
                    : setNewOffer({
                        ...newOffer,
                        discountValue: Number(e.target.value),
                      })
                }
                className="w-full px-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
              >
                <option value="PERCENTAGE">نسبة مئوية</option>
                <option value="FIXED">مبلغ ثابت</option>
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
                className="w-full px-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">نشط</option>
                <option value="INACTIVE">غير نشط</option>
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
                className="w-full px-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500"
              />
            </React.Fragment>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={editingOffer ? updateOffer : addOffer}
            className="bg-indigo-600 text-white px-4 py-2 rounded-3xl"
          >
            {editingOffer ? "تعديل العرض" : "إضافة العرض"}
          </button>
          {editingOffer && (
            <button
              onClick={() => setEditingOffer(null)}
              className="bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

    
      <div className="bg-white p-6 rounded-2xl max-w-5xl mx-auto mb-8 shadow-md flex justify-between flex-row-reverse items-center">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="...ابحث عن عرض"
            className="block w-full pl-10 pr-3 py-2 rounded-lg placeholder:text-right bg-[#ECF0F3] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

     
      <div className="bg-white p-6 rounded-2xl max-w-6xl mx-auto shadow-md">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FiRefreshCw className="animate-spin text-blue-500 text-2xl" />
          </div>
        ) : (
          <table className="min-w-full table-auto text-center border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-[#f1f5f9] text-blue-500">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">اسم العرض</th>
                <th className="px-4 py-2">الوصف</th>
                <th className="px-4 py-2">الحالة</th>
                <th className="px-4 py-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-gray-50">
              {currentOffers.map((offer) => (
                <tr
                  key={offer.id}
                  className="border-b hover:bg-gray-50 transition text-blue-950"
                >
                  <td className="px-4 py-2">{offer.id}</td>
                  <td className="px-4 py-2">{offer.name}</td>
                  <td className="px-4 py-2">{offer.description}</td>
                  <td className="px-4 py-2">{offer.status}</td>
                  <td className="px-4 py-2 flex justify-center gap-2">
                    <button
                      onClick={() => viewOfferDetails(offer.id)}
                      className="text-amber-600 border px-3 py-1 rounded-md"
                    >
                      <FiInfo />
                    </button>
                    <button
                      onClick={() => setEditingOffer(offer)}
                      className="text-blue-600 border px-3 py-1 rounded-md"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => deleteOffer(offer.id)}
                      className="text-red-600 border px-3 py-1 rounded-md"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {currentOffers.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-gray-500 text-center">
                    لا توجد عروض
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ShopOffers;