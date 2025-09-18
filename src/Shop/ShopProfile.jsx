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
      Swal.fire("خطأ", "فشل في تحميل الفروع", "error");
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

    Swal.fire("تم", "تم تحديث معلومات المتجر بنجاح", "success");
    setShop((prev) => ({ ...prev, password: "" }));
  } catch (err) {
    console.error(err);
    Swal.fire("خطأ", err.message || "فشل في تحديث بيانات المتجر", "error");
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
      Swal.fire("تم", "تمت إضافة العنوان بنجاح", "success");
      setNewAddress({
        state: "",
        city: "",
        street: "",
        building: "",
        isDefault: false,
      });
      fetchAddresses();
    } catch (err) {
      Swal.fire("خطأ", "فشل في إضافة العنوان", "error");
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
      Swal.fire("تم", "تم تحديث العنوان بنجاح", "success");
      setEditingAddressId(null);
      setEditingAddress({});
      fetchAddresses();
    } catch (err) {
      Swal.fire("خطأ", "فشل في تحديث العنوان", "error");
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
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `http://localhost:8080/api/shops/address/${id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token} `},
            }
          );
          if (!res.ok) throw new Error();
          Swal.fire("تم", "تم حذف العنوان بنجاح", "success");
          fetchAddresses();
        } catch (err) {
          Swal.fire("خطأ", "فشل في حذف العنوان", "error");
        }
      }
    });
  };

  useEffect(() => {

    fetchAddresses();
  }, []);

  return (
    <div style={{marginTop:"-500px"}} className="min-h-screen bg-gray-50 p-6 ml-64 font-cairo">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-right mb-8">
          <h1 className="text-white px-4 py-2 bg-blue-500 rounded-md font-bold text-3xl inline-block gap-4 mb-4">
            حسابك
          </h1>

          <div className="space-y-6">
           
            <div className="relative">
              <FiUser className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={shop.name}
                onChange={(e) => setShop({ ...shop, name: e.target.value })}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="اسم المحل"
              />
            </div>

           
            <div className="relative">
              <FiInfo className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={shop.description}
                onChange={(e) =>
                  setShop({ ...shop, description: e.target.value })
                }
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="الوصف"
                rows="3"
              />
            </div>

            
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                value={shop.password}
                onChange={(e) => setShop({ ...shop, password: e.target.value })}
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="كلمة المرور الجديدة"
              />
            </div>

            <button
              onClick={updateShop}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {loading ? "جارٍ التحديث..." : "تحديث بياناتك"}
            </button>
          </div>
        </div>

        
        <div className="bg-white p-8 rounded-2xl shadow-lg  text-right">
          <h2 className="text-white px-4 py-2 bg-blue-500 rounded-md font-bold text-3xl inline-block gap-4 mb-4">
            فروع المتجر
          </h2>

          {addresses.map((addr) => (
            <div
              key={addr.id}
              className=" rounded-xl p-4 mb-4 bg-blue-50 text-blue-600 font-bold"
            >
              {editingAddressId === addr.id ? (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editingAddress.state}
                    onChange={(e) =>
                      setEditingAddress({ ...editingAddress, state: e.target.value })
                    }
                    placeholder="الولاية"
                    className="block w-full pl-10 pr-3 py-3 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editingAddress.city}
                    onChange={(e) =>
                      setEditingAddress({ ...editingAddress, city: e.target.value })
                    }
                    placeholder="المدينة"
                    className="block w-full pl-10 pr-3 py-3 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editingAddress.street}
                    onChange={(e) =>
                      setEditingAddress({ ...editingAddress, street: e.target.value })
                    }
                    placeholder="الشارع"
                    className="block w-full pl-10 pr-3 py-3 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={editingAddress.building}
                    onChange={(e) =>
                      setEditingAddress({ ...editingAddress, building: e.target.value })
                    }
                    placeholder="المبنى"
                    className="block w-full pl-10 pr-3 py-3 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={updateAddress}
                    className="bg-emerald-100  border-emerald-400 text-emerald-500 font-bold px-3 py-2 rounded-lg"
                  >
                    <FiCheckSquare className="inline" /> حفظ
                  </button>
                  <button
                    onClick={() => setEditingAddressId(null)}
                    className="bg-gray-500 text-white px-3 py-2 rounded-lg"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p>
                    <FiMapPin className="inline text-blue-500" /> {addr.state},{" "}
                    {addr.city}, {addr.street}, {addr.building}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingAddressId(addr.id);
                        setEditingAddress(addr);
                      }}
                      className="bg-white   text-amber-500 px-3 py-2 rounded-3xl"
                    >
                      <FiEdit3 />
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="bg-white   text-red-500 px-3 py-2 rounded-3xl"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          
          <div className="bg-gray-50 shadow rounded-xl p-6 mt-6">
            <h3 className="text-xl font-bold text-blue-500 mb-4">
              إضافة عنوان جديد
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                value={newAddress.state}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, state: e.target.value })
                }
                placeholder="الولاية"
                className="block w-full pl-10 pr-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={newAddress.city}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, city: e.target.value })
                }
                placeholder="المدينة"
                className="block w-full pl-10 pr-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={newAddress.street}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, street: e.target.value })
                }
                placeholder="الشارع"
                className="block w-full pl-10 pr-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={newAddress.building}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, building: e.target.value })
                }
                placeholder="المبنى"
                className="block w-full pl-10 pr-3 py-3 rounded-xl bg-[#ECF0F3] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 mb-4 text-right">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={(e) =>
                  setNewAddress({ ...newAddress, isDefault: e.target.checked })
                }
              />
              اجعل هذا العنوان أساسي
            </label>
            <button
              onClick={addAddress}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
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