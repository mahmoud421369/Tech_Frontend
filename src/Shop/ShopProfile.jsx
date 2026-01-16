import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  FiEdit3, FiMapPin, FiTrash2, FiCheckSquare, FiX,
  FiMail, FiPhone, FiStar, FiCalendar, FiTag, FiCheckCircle, FiShield,
  FiLock
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import api from '../api';
import useAuthStore from '../store/Auth';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-10 h-10 border-4 border-lime-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ShopProfileSkeleton = () => (
  <div className="animate-pulse space-y-10">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-3xl p-8 shadow-lg">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4 mx-auto"></div>
          <div className="h-16 bg-gray-100 rounded-2xl"></div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-3xl p-10 shadow-lg">
      <div className="h-10 bg-gray-200 rounded w-1/2 mb-8"></div>
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-2xl"></div>
        ))}
      </div>
    </div>
  </div>
);

const ShopProfile = () => {
  const { accessToken, user } = useAuthStore();
  const shopId = localStorage.getItem('id') || user?.id || user?.shopId;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "إدارة الملف الشخصي - المتجر";
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!accessToken || !shopId || hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);

    try {
      const [shopRes, addrRes] = await Promise.all([
        api.get(`/api/shops/${shopId}`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        api.get('/api/shops/address', { headers: { Authorization: `Bearer ${accessToken}` } })
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

      let addrList = addrRes.data.content || addrRes.data || [];
      if (data.shopAddress?.id && !addrList.some(a => a.id === data.shopAddress.id)) {
        addrList = [data.shopAddress, ...addrList];
      }
      setAddresses(addrList);

    } catch (err) {
      console.error(err);
      // Swal.fire('خطأ', 'فشل تحميل بيانات المتجر', 'error');
    } finally {
      setLoading(false);
    }
  }, [accessToken, shopId]);

  const updateShop = useCallback(async () => {
    if (!shop.name.trim()) return Swal.fire('خطأ', 'اسم المتجر مطلوب', 'warning');
    setLoading(true);

    try {
      const payload = { name: shop.name.trim(), description: shop.description.trim() };
      if (shop.password?.trim()) payload.password = shop.password.trim();

      await api.put(`/api/shops/${shopId}`, payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      Swal.fire({ title: 'تم التحديث بنجاح!', icon: 'success',toast: true,
          position: "top-end",
          timer: 2000, showConfirmButton: false });
      setShop(prev => ({ ...prev, password: '' }));
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire('خطأ', err.response?.data?.message || 'فشل التحديث', 'error');
    } finally {
      setLoading(false);
    }
  }, [shop, accessToken, shopId, fetchAllData]);

  const addAddress = useCallback(async () => {
    if (!newAddress.state || !newAddress.city || !newAddress.street) {
      return Swal.fire('تنبيه', 'يرجى ملء الحقول المطلوبة', 'warning');
    }

    try {
      await api.post('/api/shops/address', newAddress, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      Swal.fire({ title: 'تمت الإضافة!', icon: 'success' ,
          toast: true,
          position: "top-end",
          timer: 2000, });
      setNewAddress({ state: '', city: '', street: '', building: '', isDefault: false });
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire('خطأ', 'فشل إضافة العنوان', 'error');
    }
  }, [newAddress, accessToken, fetchAllData]);

  const updateAddress = useCallback(async () => {
    try {
      await api.put(`/api/shops/address/${editingAddressId}`, editingAddress, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      Swal.fire({ title: 'تم التحديث!', icon: 'success',toast: true,
          position: "top-end",
          timer: 2000, });
      setEditingAddressId(null);
      setEditingAddress({});
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire('خطأ', 'فشل تحديث العنوان', 'error');
    }
  }, [editingAddressId, editingAddress, accessToken, fetchAllData]);

  const deleteAddress = useCallback(async (id) => {
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'سيتم حذف العنوان نهائياً!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#dc2626'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/shops/address/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      Swal.fire({ title: 'تم الحذف!', icon: 'success', toast: true,
          position: "top-end",
          timer: 2000,});
      hasFetched.current = false;
      fetchAllData();
    } catch (err) {
      Swal.fire('خطأ', 'فشل حذف العنوان', 'error');
    }
  }, [accessToken, fetchAllData]);

  useEffect(() => {
    if (accessToken && shopId) {
      fetchAllData();
    }
  }, [accessToken, shopId, fetchAllData]);

  if (!accessToken || !shopId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-cairo">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md">
          <FaStore className="w-16 h-16 text-lime-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">يرجى تسجيل الدخول</h2>
          <p className="text-lg text-gray-600">للوصول إلى إعدادات متجرك</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{marginTop:"-540px",marginLeft:"-250px"}} className="min-h-screen bg-gray-50 font-cairo py-8">
      <div className="max-w-5xl mx-auto px-6">

     
        <div className="mb-10 bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between text-right gap-6">
            <div className="p-5 bg-lime-100 rounded-3xl">
              <FaStore className="text-5xl text-lime-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">إدارة الملف الشخصي</h1>
              <p className="text-xl text-gray-600 mt-2">تحديث بيانات متجرك وإدارة العناوين بسهولة</p>
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 mb-10">
 
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xl font-semibold text-gray-800">تحديث سريع</p>
      </div>
      <div className="p-4 bg-lime-50 rounded-xl group-hover:bg-lime-100 transition-colors">
        <FiEdit3 className="w-12 h-12 text-lime-600" />
      </div>
    </div>
  </div>

 
  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xl font-semibold text-gray-800">عناوين متعددة</p>
      </div>
      <div className="p-4 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
        <FiMapPin className="w-12 h-12 text-blue-600" />
      </div>
    </div>
  </div>


  <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-7 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xl font-semibold text-gray-800">أمان عالي</p>
      </div>
      <div className="p-4 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
        <FiShield className="w-12 h-12 text-green-600" />
      </div>
    </div>
  </div>
</div>

        {loading ? <ShopProfileSkeleton /> : (
          <>
            
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10 mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-right flex items-center gap-4 justify-end">
                <FiEdit3 className="text-3xl text-lime-600" />
                تحديث بيانات المتجر
              </h2>

             
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="space-y-6">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2 text-right">اسم المتجر</label>
                    <div className="relative">
                      <FaStore className="absolute left-5 top-1/2 -translate-y-1/2 text-lime-600 text-xl" />
                      <input
                        type="text"
                        value={shop.name}
                        onChange={e => setShop({ ...shop, name: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-lime-200 focus:border-lime-500 outline-none text-lg"
                        placeholder="اسم متجرك"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2 text-right">وصف المتجر</label>
                    <div className="relative">
                      <FiEdit3 className="absolute left-5 top-5 text-lime-600 text-xl" />
                      <textarea
                        value={shop.description}
                        onChange={e => setShop({ ...shop, description: e.target.value })}
                        rows="4"
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-lime-200 focus:border-lime-500 outline-none resize-none text-lg"
                        placeholder="وصف مختصر..."
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2 text-right">كلمة مرور جديدة (اختياري)</label>
                    <div className="relative">
                      <FiLock className="absolute left-5 top-1/2 -translate-y-1/2 text-lime-600 text-xl" />
                      <input
                        type="password"
                        value={shop.password}
                        onChange={e => setShop({ ...shop, password: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-lime-200 focus:border-lime-500 outline-none text-lg"
                        placeholder="اتركه فارغاً إذا لا تريد التغيير"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <button
                    onClick={updateShop}
                    disabled={loading}
                    className="w-full py-5 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xl rounded-2xl shadow-xl transition transform hover:scale-105 flex items-center justify-center gap-3"
                  >
                    <FiCheckCircle className="text-2xl" />
                    {loading ? 'جاري التحديث...' : 'تحديث البيانات'}
                  </button>
                </div>

                
                <div className="space-y-5">
                  <div className="flex justify-center mb-6">
                    <div className="w-28 h-28 bg-lime-100 rounded-full flex items-center justify-center text-5xl font-bold text-lime-700 border-4 border-lime-300">
                      {shop.name?.[0]?.toUpperCase() || <FaStore className="text-4xl" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { icon: FiTag, label: 'معرف المتجر', value: `#${shop.id}` },
                      { icon: FiMail, label: 'البريد', value: shop.email },
                      { icon: FiPhone, label: 'الهاتف', value: shop.phone || 'غير محدد' },
                      { icon: FiCheckSquare, label: 'الحالة', value: shop.activate ? 'نشط' : 'معطل', good: shop.activate },
                      { icon: FiCheckCircle, label: 'التحقق', value: shop.verified ? 'تم التحقق' : 'غير متحقق', good: shop.verified },
                      { icon: FiStar, label: 'التقييم', value: shop.rating > 0 ? `${shop.rating.toFixed(1)} ★` : 'لا تقييمات' },
                      { icon: FiCalendar, label: 'تاريخ الإنشاء', value: shop.createdAt ? new Date(shop.createdAt).toLocaleDateString('ar-EG') : '—' },
                      { icon: FiTag, label: 'نوع المتجر', value: shop.shopType || 'غير محدد' },
                    ].map(({ icon: Icon, label, value, good }, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                        <Icon className="text-2xl text-lime-600 flex-shrink-0" />
                        <div className="flex-1 text-right">
                          <p className="text-sm text-gray-500">{label}</p>
                          <p className={`text-lg font-bold ${good !== undefined ? (good ? 'text-green-600' : 'text-red-600') : 'text-gray-800'}`}>
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          
            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-right flex items-center gap-4 justify-end">
                <FiMapPin className="text-3xl text-lime-600" />
                عناوين التوصيل
              </h2>

              <div className="space-y-5 mb-10">
                {addresses.length === 0 ? (
                  <p className="text-center text-gray-500 py-10 text-lg">لم تُضف أي عناوين بعد</p>
                ) : (
                  addresses.map(addr => (
                    <div key={addr.id} className={`p-6 rounded-2xl border-2 ${addr.isDefault ? 'border-lime-500 bg-lime-50' : 'border-gray-200 bg-gray-50'}`}>
                      {editingAddressId === addr.id ? (
                        <div className="space-y-4">
                          {['state', 'city', 'street', 'building'].map(field => (
                            <input
                              key={field}
                              type="text"
                              value={editingAddress[field] || ''}
                              onChange={e => setEditingAddress({ ...editingAddress, [field]: e.target.value })}
                              placeholder={field === 'state' ? 'المحافظة' : field === 'city' ? 'المدينة' : field === 'street' ? 'الشارع' : 'المبنى (اختياري)'}
                              className="w-full px-5 py-3 rounded-xl border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-lime-500 text-lg"
                              dir="rtl"
                            />
                          ))}
                          <div className="flex gap-3">
                            <button onClick={updateAddress} className="flex-1 py-3 bg-lime-600 text-white rounded-xl hover:bg-lime-700 flex items-center justify-center gap-2">
                              <FiCheckSquare /> حفظ
                            </button>
                            <button onClick={() => { setEditingAddressId(null); setEditingAddress({}); }} className="flex-1 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 flex items-center justify-center gap-2">
                              <FiX /> إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              <FiMapPin className="text-lime-600" />
                              {addr.state} - {addr.city}
                            </p>
                            <p className="text-gray-600 mt-1">{addr.street} {addr.building && `– ${addr.building}`}</p>
                            {addr.isDefault && <span className="inline-block mt-2 px-4 py-1 bg-lime-600 text-white rounded-full text-sm">الأساسي</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingAddressId(addr.id); setEditingAddress({ ...addr }); }} className="p-3 bg-white border text-lime-700 rounded-xl ">
                              <FiEdit3 className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteAddress(addr.id)} className="p-3 bg-white border text-red-700 rounded-xl ">
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

           
              <div className="border-t-2 border-dashed border-gray-300 pt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-right">إضافة عنوان جديد</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['state', 'city', 'street', 'building'].map(field => (
                    <input
                      key={field}
                      type="text"
                      value={newAddress[field]}
                      onChange={e => setNewAddress({ ...newAddress, [field]: e.target.value })}
                      placeholder={field === 'state' ? 'المحافظة' : field === 'city' ? 'المدينة' : field === 'street' ? 'الشارع' : 'المبنى (اختياري)'}
                      className="px-5 py-4 bg-gray-50 border border-gray-300 cursor-pointer focus:outline-none rounded-xl focus:ring-2 focus:ring-lime-500 text-lg"
                      dir="rtl"
                    />
                  ))}
                </div>
                <label className="flex items-center gap-3 mt-4 text-lg">
                  <input
                    type="checkbox"
                    checked={newAddress.isDefault}
                    onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="w-6 h-6 text-lime-600 rounded"
                  />
                  <span>تعيين كعنوان أساسي</span>
                </label>
                <button
                  onClick={addAddress}
                  disabled={loading}
                  className="w-full mt-6 py-4 bg-lime-600 hover:bg-lime-700 text-white font-bold text-xl rounded-xl shadow-xl transition transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <FiMapPin className="text-2xl" />
                  إضافة العنوان
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ShopProfile;