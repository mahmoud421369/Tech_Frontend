import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FiUser,
  FiInfo,
  FiLock,
  FiMapPin,
  FiTrash2,
  FiEdit3,
  FiCheckSquare,
  FiX,
} from "react-icons/fi";

const ShopProfile = () => {
  const token = localStorage.getItem("authToken");
  const [shop, setShop] = useState({
    name: "",
    description: "",
    password: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    state: "",
    city: "",
    street: "",
    building: "",
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingAddress, setEditingAddress] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/shops/address", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAddresses(data.content);
    } catch (err) {
      Swal.fire({
        title: "خطأ",
        text: "فشل في تحميل الفروع",
        icon: "error",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
      setAddresses([]);
    }
  };

  const updateShop = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: shop.name,
        description: shop.description,
      };

      if (shop.password && shop.password.trim() !== "") {
        updateData.password = shop.password;
      }

      const res = await fetch(`http://localhost:8080/api/shops`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update shop");
      }

      Swal.fire({
        title: "تم",
        text: "تم تحديث معلومات المتجر بنجاح",
        icon: "success",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
      setShop((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "خطأ",
        text: err.message || "فشل في تحديث بيانات المتجر",
        icon: "error",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/shops/address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAddress),
      });
      if (!res.ok) throw new Error();
      Swal.fire({
        title: "تم",
        text: "تمت إضافة العنوان بنجاح",
        icon: "success",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
      setNewAddress({
        state: "",
        city: "",
        street: "",
        building: "",
        isDefault: false,
      });
      fetchAddresses();
    } catch (err) {
      Swal.fire({
        title: "خطأ",
        text: "فشل في إضافة العنوان",
        icon: "error",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
    }
  };

  const updateAddress = async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/shops/address/${editingAddressId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingAddress),
        }
      );
      if (!res.ok) throw new Error();
      Swal.fire({
        title: "تم",
        text: "تم تحديث العنوان بنجاح",
        icon: "success",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
      setEditingAddressId(null);
      setEditingAddress({});
      fetchAddresses();
    } catch (err) {
      Swal.fire({
        title: "خطأ",
        text: "فشل في تحديث العنوان",
        icon: "error",
        customClass: {
          popup: "dark:bg-gray-800 dark:text-white",
        },
      });
    }
  };

  const deleteAddress = async (id) => {
    Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تتمكن من استعادة هذا العنوان بعد الحذف!",
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
            `http://localhost:8080/api/shops/address/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!res.ok) throw new Error();
          Swal.fire({
            title: "تم",
            text: "تم حذف العنوان بنجاح",
            icon: "success",
            customClass: {
              popup: "dark:bg-gray-800 dark:text-white",
            },
          });
          fetchAddresses();
        } catch (err) {
          Swal.fire({
            title: "خطأ",
            text: "فشل في حذف العنوان",
            icon: "error",
            customClass: {
              popup: "dark:bg-gray-800 dark:text-white",
            },
          });
        }
      }
    });
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div style={{marginTop:"-600px"}} className="min-h-screen font-cairo bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
        <div className="lg:col-span-2 h-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-right">
          <h1 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
            <FiUser className="text-xl" /> حسابك
          </h1>
          <div className="space-y-4">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="text"
                value={shop.name}
                onChange={(e) => setShop({ ...shop, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                placeholder="اسم المحل"
                dir="rtl"
              />
            </div>
            <div className="relative">
              <FiInfo className="absolute left-3 top-3 text-gray-400 dark:text-gray-300" />
              <textarea
                value={shop.description}
                onChange={(e) => setShop({ ...shop, description: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                placeholder="الوصف"
                rows="4"
                dir="rtl"
              />
            </div>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-300" />
              <input
                type="password"
                value={shop.password}
                onChange={(e) => setShop({ ...shop, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                placeholder="كلمة المرور الجديدة"
                dir="rtl"
              />
            </div>
            <button
              onClick={updateShop}
              disabled={loading}
              className="w-full px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
            >
              {loading ? "جارٍ التحديث..." : "تحديث بياناتك"}
            </button>
          </div>
        </div>

       
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-right">
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
            <FiMapPin className="text-xl" /> فروع المتجر
          </h2>
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md"
              >
                {editingAddressId === addr.id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editingAddress.state}
                      onChange={(e) =>
                        setEditingAddress({ ...editingAddress, state: e.target.value })
                      }
                      placeholder="الولاية"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                      dir="rtl"
                    />
                    <input
                      type="text"
                      value={editingAddress.city}
                      onChange={(e) =>
                        setEditingAddress({ ...editingAddress, city: e.target.value })
                      }
                      placeholder="المدينة"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                      dir="rtl"
                    />
                    <input
                      type="text"
                      value={editingAddress.street}
                      onChange={(e) =>
                        setEditingAddress({ ...editingAddress, street: e.target.value })
                      }
                      placeholder="الشارع"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                      dir="rtl"
                    />
                    <input
                      type="text"
                      value={editingAddress.building}
                      onChange={(e) =>
                        setEditingAddress({ ...editingAddress, building: e.target.value })
                      }
                      placeholder="المبنى"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                      dir="rtl"
                    />
                    <button
                      onClick={updateAddress}
                      className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all duration-200 flex items-center gap-2"
                    >
                      <FiCheckSquare /> حفظ
                    </button>
                    <button
                      onClick={() => setEditingAddressId(null)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 flex items-center gap-2"
                    >
                      <FiX /> إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <p className="text-gray-700 dark:text-gray-200">
                      <FiMapPin className="inline text-indigo-600 dark:text-indigo-400 mr-2" />
                      {addr.state}, {addr.city}, {addr.street}, {addr.building}
                      {addr.isDefault && (
                        <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-1 rounded-full">
                          أساسي
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAddressId(addr.id);
                          setEditingAddress(addr);
                        }}
                        className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-all duration-200"
                      >
                        <FiEdit3 />
                      </button>
                      <button
                        onClick={() => deleteAddress(addr.id)}
                        className="p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-all duration-200"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {addresses.length === 0 && (
              <div className="text-center py-6">
                <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  لا توجد عناوين
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  أضف عنوانًا جديدًا لبدء إدارة فروع المتجر
                </p>
              </div>
            )}
          </div>

         
          <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
              <FiMapPin /> إضافة عنوان جديد
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newAddress.state}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, state: e.target.value })
                }
                placeholder="الولاية"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
              <input
                type="text"
                value={newAddress.city}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, city: e.target.value })
                }
                placeholder="المدينة"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
              <input
                type="text"
                value={newAddress.street}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, street: e.target.value })
                }
                placeholder="الشارع"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
              <input
                type="text"
                value={newAddress.building}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, building: e.target.value })
                }
                placeholder="المبنى"
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-600 dark:text-white border border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-300"
                dir="rtl"
              />
            </div>
            <label className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, isDefault: e.target.checked })
                }
                className="form-checkbox h-5 w-5 text-indigo-600 dark:text-indigo-400"
              />
              اجعل هذا العنوان أساسي
            </label>
            <button
              onClick={addAddress}
              disabled={loading}
              className="w-full px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
            >
              {loading ? "جارٍ الإضافة..." : "إضافة عنوان جديد"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopProfile;