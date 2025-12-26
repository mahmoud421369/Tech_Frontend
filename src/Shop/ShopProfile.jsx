import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  FiUser, FiInfo, FiLock, FiMapPin, FiTrash2, FiEdit3,
  FiCheckSquare, FiX, FiMail, FiPhone, FiStar, FiCalendar, FiTag,
  FiPackage, FiShield, FiGlobe
} from 'react-icons/fi';
import api from '../api';
import useAuthStore from '../store/Auth';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ShopProfileSkeleton = () => (
  <div className="animate-pulse p-6 space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-lime-100">
        <div className="h-8 bg-lime-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-lime-100 rounded"></div>
          ))}
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-lime-100">
        <div className="h-8 bg-lime-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-6 bg-lime-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ShopProfile = ({ darkMode }) => {
  const { accessToken, user } = useAuthStore();


  const getShopId = () => {
    const stored = localStorage.getItem('id');
    if (stored && !isNaN(stored)) return parseInt(stored);
    return user?.shopId || user?.id || null;
  };

  const shopId = localStorage.getItem('id');
  const hasFetched = useRef(false);

  const [shop, setShop] = useState({
    id: '', email: '', name: '', description: '', password: '',
    verified: false, phone: '', rating: 0, createdAt: '', updatedAt: '',
    shopType: '', activate: false
  });

  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    state: '', city: '', street: '', building: '', isDefault: false
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingAddress, setEditingAddress] = useState({});
  const [loading, setLoading] = useState(false);

useEffect(() => {
document.title = "إدارة الحساب الشخصي";

});

  const fetchAllData = useCallback(async () => {
    if (!accessToken || !shopId || hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);

    const controller = new AbortController();

    try {
      const [shopRes, addrRes] = await Promise.all([
        api.get(`/api/shops/${shopId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal
        }),
        api.get('/api/shops/address', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal
        })
      ]);

      const data = shopRes.data || {};
      setShop({
        id: data.id || '',
        email: data.email || '',
        name: data.name || '',
        description: data.description || '',
        password: '',
        verified: data.verified || false,
        phone: data.phone || '',
        rating: data.rating || 0,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
        shopType: data.shopType || '',
        activate: data.activate || false,
      });

      let addrList = addrRes.data.content || [];
      if (data.shopAddress?.id) {
        const exists = addrList.some(a => a.id === data.shopAddress.id);
        if (!exists) addrList = [data.shopAddress, ...addrList];
      }
      setAddresses(addrList);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        Swal.fire({ title: 'خطأ', text: 'فشل في تحميل البيانات', icon: 'error' });
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [accessToken, shopId]);

 
  const updateShop = useCallback(async () => {
    if (!accessToken || !shopId) return;
    setLoading(true);

    try {
      const payload = { name: shop.name, description: shop.description };
      if (shop.password?.trim()) payload.password = shop.password;

      await api.put(`/api/shops/${shopId}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      Swal.fire({ title: 'تم', text: 'تم التحديث بنجاح', icon: 'success', timer: 1500, showConfirmButton: false });
      setShop(prev => ({ ...prev, password: '' }));
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire({ title: 'خطأ', text: err.response?.data?.message || 'فشل في التحديث', icon: 'error' });
    } finally {
      setLoading(false);
    }
  }, [shop, accessToken, shopId, fetchAllData]);

  
  const addAddress = useCallback(async () => {
    if (!accessToken) return;
    if (!newAddress.state || !newAddress.city || !newAddress.street) {
      return Swal.fire({ title: 'خطأ', text: 'يرجى ملء جميع الحقول', icon: 'warning' });
    }

    try {
      await api.post('/api/shops/address', newAddress, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      Swal.fire({ title: 'تم', text: 'تمت الإضافة', icon: 'success', timer: 1500, showConfirmButton: false });
      setNewAddress({ state: '', city: '', street: '', building: '', isDefault: false });
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire({ title: 'خطأ', text: 'فشل في الإضافة', icon: 'error' });
    }
  }, [newAddress, accessToken, fetchAllData]);


  const updateAddress = useCallback(async () => {
    if (!accessToken || !editingAddressId) return;
    try {
      await api.put(`/api/shops/address/${editingAddressId}`, editingAddress, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      Swal.fire({ title: 'تم', text: 'تم التحديث', icon: 'success', timer: 1500, showConfirmButton: false });
      setEditingAddressId(null);
      setEditingAddress({});
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire({ title: 'خطأ', text: 'فشل في التحديث', icon: 'error' });
    }
  }, [editingAddressId, editingAddress, accessToken, fetchAllData]);


  const deleteAddress = useCallback(async (id) => {
    if (!accessToken) return;
    const res = await Swal.fire({
      title: 'تأكيد الحذف', text: 'لا يمكن التراجع!', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'احذف', cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626'
    });
    if (!res.isConfirmed) return;

    try {
      await api.delete(`/api/shops/address/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      Swal.fire({ title: 'تم', text: 'تم الحذف', icon: 'success', timer: 1500, showConfirmButton: false });
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire({ title: 'خطأ', text: 'فشل في الحذف', icon: 'error' });
    }
  }, [accessToken, fetchAllData]);

  
  useEffect(() => {
    if (accessToken && shopId && !hasFetched.current) {
      fetchAllData();
    }
    return () => { hasFetched.current = false; };
  }, [accessToken, shopId, fetchAllData]);


  if (!accessToken || !shopId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-lime-50 to-white flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl border">
          <h2 className="text-2xl font-bold text-lime-700">يرجى تسجيل الدخول</h2>
          <p className="mt-2 text-gray-600">لعرض بيانات المتجر</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{marginTop:"-575px",marginLeft:"-300px"}} className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-lime-50 p-4 sm:p-6 md:p-8 font-cairo">
      <div className="max-w-7xl mx-auto  lg:ml-72 md:ml-64 sm:ml-20 ml-4 space-y-8">

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl gap-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border  shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center text-right gap-3 mb-3">
              <div className="p-3 bg-lime-100 rounded-xl">
                <FiPackage className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="font-bold text-lime-800">إدارة المنتجات</h3>
            </div>
            <p className="text-sm text-lime-600">أضف، عدّل، أو احذف منتجاتك بسهولة</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border  shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center text-right gap-3 mb-3">
              <div className="p-3 bg-lime-100 rounded-xl">
                <FiShield className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="font-bold text-lime-800">أمان عالي</h3>
            </div>
            <p className="text-sm text-lime-600">بياناتك محمية بأحدث تقنيات التشفير</p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border  shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 text-right mb-3">
              <div className="p-3 bg-lime-100 rounded-xl">
                <FiGlobe className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="font-bold text-lime-800">توصيل سريع</h3>
            </div>
            <p className="text-sm text-lime-600">شحن إلى جميع المحافظات في مصر</p>
          </div>
        </div>

        
        {loading ? <ShopProfileSkeleton /> : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        
            <div className="lg:col-span-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border shadow-lg">
              <h1 className="text-2xl font-bold text-lime-700 text-right justify-end mb-6 flex items-center gap-2">
                <FiUser /> تحديث بيانات المتجر
              </h1>
              <div className="space-y-4">
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600" />
                  <input
                    type="text" value={shop.name}
                    onChange={e => setShop({ ...shop, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-lime-900 placeholder-lime-400 border  rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-all"
                    placeholder="اسم المحل" dir="rtl"
                  />
                </div>
                <div className="relative">
                  <FiInfo className="absolute left-3 top-3 text-lime-600" />
                  <textarea
                    value={shop.description}
                    onChange={e => setShop({ ...shop, description: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-lime-900 placeholder-lime-400 border  rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-all resize-none"
                    placeholder="الوصف" rows="4" dir="rtl"
                  />
                </div>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600" />
                  <input
                    type="password" value={shop.password}
                    onChange={e => setShop({ ...shop, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-lime-900 placeholder-lime-400 border  rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none transition-all"
                    placeholder="كلمة مرور جديدة (اختياري)" dir="rtl"
                  />
                </div>
                <button
                  onClick={updateShop} disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-lime-500 to-green-600 text-white font-bold rounded-lg shadow-md hover:shadow-lime-500/50 transition-all disabled:opacity-70"
                >
                  {loading ? 'جارٍ التحديث...' : 'تحديث الحساب'}
                </button>
              </div>
            </div>

            
            <div className="lg:col-span-4 bg-white/90 backdrop-blur-sm rounded-2xl p-6 border  shadow-lg">
              <h2 className="text-xl font-bold text-lime-700 mb-6 flex items-center justify-end gap-2">
                <FiInfo /> تفاصيل المتجر
              </h2>
              <div className="space-y-3 text-lime-800 text-sm">
                {[
                  { icon: FiTag, label: 'المعرف', value: shop.id },
                  { icon: FiMail, label: 'البريد', value: shop.email },
                  { icon: FiPhone, label: 'الهاتف', value: shop.phone || 'غير متوفر' },
                  { icon: FiCheckSquare, label: 'الحالة', value: shop.activate ? 'نشط' : 'غير نشط', badge: true },
                  { icon: FiCheckSquare, label: 'التحقق', value: shop.verified ? 'تم التحقق' : 'غير متحقق', badge: true },
                  { icon: FiStar, label: 'التقييم', value: shop.rating ? `${shop.rating.toFixed(1)}/5` : '—' },
                  { icon: FiCalendar, label: 'الإنشاء', value: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('ar-EG') : '—' },
                  { icon: FiCalendar, label: 'التحديث', value: shop.updatedAt ? new Date(shop.updatedAt).toLocaleDateString('ar-EG') : '—' },
                  { icon: FiTag, label: 'النوع', value: shop.shopType || 'غير محدد' },
                ].map(({ icon: Icon, label, value, badge }, i) => (
                  <div key={i} className="flex items-center  gap-2">
                    <Icon className="text-lime-600" />
                    <p className='flex flex-row-reverse justify-between'><strong>{}</strong>{' '}
                      {badge ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          value.includes('نشط') || value.includes('تم') ? 'bg-lime-100 text-lime-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {value}
                        </span>
                      ) : <span className="text-gray-600">{value}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        
        <div className="bg-white/90 max-w-4xl backdrop-blur-sm rounded-2xl p-6 border  shadow-lg">
          <h2 className="text-xl font-bold text-lime-700 mb-6 flex items-center gap-2">
            <FiMapPin /> الفروع والعناوين
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
            {addresses.length === 0 ? (
              <p className="text-lime-500 text-center py-6 text-sm">لا توجد عناوين مضافة</p>
            ) : (
              addresses.map(addr => (
                <div key={addr.id} className="bg-gray-50 p-4 rounded-lg border ">
                  {editingAddressId === addr.id ? (
                    <div className="space-y-2">
                      {['state', 'city', 'street', 'building'].map(f => (
                        <input
                          key={f} type="text" value={editingAddress[f] || ''}
                          onChange={e => setEditingAddress({ ...editingAddress, [f]: e.target.value })}
                          placeholder={f === 'state' ? 'المحافظة' : f === 'city' ? 'المدينة' : f === 'street' ? 'الشارع' : 'رقم المبنى'}
                          className="w-full px-3 py-2 bg-white text-lime-900 rounded border border-lime-300 focus:ring-2 focus:ring-lime-500"
                          dir="rtl"
                        />
                      ))}
                      <div className="flex gap-2">
                        <button onClick={updateAddress} className="flex-1 bg-lime-600 text-white py-2 rounded hover:bg-lime-700 transition flex items-center justify-center gap-1 text-sm">
                          <FiCheckSquare /> حفظ
                        </button>
                        <button onClick={() => { setEditingAddressId(null); setEditingAddress({}); }} className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition flex items-center justify-center gap-1 text-sm">
                          <FiX /> إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <p className="text-lime-700 text-sm leading-relaxed">
                        <FiMapPin className="inline text-lime-600 ml-1" />
                        {addr.state}, {addr.city}, {addr.street}, {addr.building || ''}
                        {addr.isDefault && <span className="mr-2 text-xs bg-lime-600 text-white px-2 py-1 rounded-full">أساسي</span>}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingAddressId(addr.id); setEditingAddress(addr); }}
                          className="p-2 bg-lime-100 text-lime-700 rounded hover:bg-lime-200 transition"
                          title="تعديل"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAddress(addr.id)}
                          className="p-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                          title="حذف"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg  border ">
            <h3 className="text-lime-700 font-bold mb-3 text-sm text-right">إضافة عنوان جديد</h3>
            {['state', 'city', 'street', 'building'].map(f => (
              <input
                key={f} type="text" value={newAddress[f]}
                onChange={e => setNewAddress({ ...newAddress, [f]: e.target.value })}
                placeholder={f === 'state' ? 'المحافظة' : f === 'city' ? 'المدينة' : f === 'street' ? 'الشارع' : 'رقم المبنى (اختياري)'}
                className="w-full mb-2 px-3 py-2 bg-white text-lime-900 rounded focus:outline-none cursor-pointer border  focus:ring-2 focus:ring-lime-500 text-sm"
                dir="rtl"
              />
            ))}
            <label className="flex items-center gap-2 text-lime-700 text-sm mb-3">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                className="w-4 h-4 text-lime-600 rounded focus:ring-lime-500"
              />
              تعيين كعنوان أساسي
            </label>
            <button
              onClick={addAddress}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-lime-500 to-green-600 text-white font-medium rounded-lg shadow hover:shadow-lime-500/50 transition-all text-sm disabled:opacity-70"
            >
              {loading ? 'جارٍ الإضافة...' : 'إضافة العنوان'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopProfile;