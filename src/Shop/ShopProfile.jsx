import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import {
  FiUser,
  FiInfo,
  FiLock,
  FiMapPin,
  FiTrash2,
  FiEdit3,
  FiCheckSquare,
  FiX,
  FiMail,
  FiPhone,
  FiStar,
  FiCalendar,
  FiTag,
} from 'react-icons/fi';
import api from '../api';
import useAuthStore from '../store/Auth';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const ShopProfileSkeleton = ({ darkMode }) => (
  <div className="animate-pulse p-4 sm:p-6 md:p-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900 rounded-2xl shadow-md p-4 sm:p-6">
        <div className="h-8 w-1/3 bg-indigo-200 dark:bg-indigo-700 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-10 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
          ))}
          <div className="h-12 w-1/2 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
        </div>
      </div>
      <div className="bg-indigo-50 dark:bg-indigo-900 rounded-2xl shadow-md p-4 sm:p-6">
        <div className="h-8 w-1/3 bg-indigo-200 dark:bg-indigo-700 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="h-6 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
          ))}
        </div>
      </div>
      <div className="bg-indigo-50 dark:bg-indigo-900 rounded-2xl shadow-md p-4 sm:p-6">
        <div className="h-8 w-1/3 bg-indigo-200 dark:bg-indigo-700 rounded mb-6"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-10 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
          ))}
          <div className="h-12 w-1/2 bg-indigo-200 dark:bg-indigo-700 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const ShopProfile = ({ darkMode }) => {
  const { accessToken } = useAuthStore((state) => ({
    accessToken: state.accessToken,
  }));
  const [shop, setShop] = useState({
    id: '',
    email: '',
    name: '',
    description: '',
    password: '',
    verified: false,
    phone: '',
    rating: 0,
    createdAt: '',
    updatedAt: '',
    shopType: '',
    activate: false,
  });
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    state: '',
    city: '',
    street: '',
    building: '',
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingAddress, setEditingAddress] = useState({});
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  const fetchShop = useCallback(async () => {
    if (!accessToken) {
      console.warn('fetchShop: Missing accessToken');
      return;
    }
    const controller = new AbortController();
    try {
      setLoading(true);
      const res = await api.get('/api/shops', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: controller.signal,
      });
      const data = res.data || {};
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
      if (data.shopAddress?.id) {
        setAddresses((prev) => {
          const exists = prev.some((addr) => addr.id === data.shopAddress.id);
          return exists ? prev : [data.shopAddress, ...prev.filter((addr) => addr.id !== data.shopAddress.id)];
        });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching shop details:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: err.message || 'فشل في تحميل بيانات المتجر',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [accessToken]);

  const fetchAddresses = useCallback(async () => {
    if (!accessToken) {
      console.warn('fetchAddresses: Missing accessToken');
      return;
    }
    const controller = new AbortController();
    try {
      const res = await api.get('/api/shops/address', {
        signal: controller.signal,
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setAddresses(res.data.content || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching addresses:', err.response?.data || err.message);
        Swal.fire({
          title: 'خطأ',
          text: 'فشل في تحميل الفروع',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
        setAddresses([]);
      }
    }
  }, [accessToken]);

  const updateShop = useCallback(async () => {
    if (!accessToken) {
      console.warn('updateShop: Missing accessToken');
      return;
    }
    setLoading(true);
    try {
      const updateData = {
        name: shop.name,
        description: shop.description,
      };
      if (shop.password && shop.password.trim() !== '') {
        updateData.password = shop.password;
      }
      await api.put('/api/shops', updateData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      Swal.fire({
        title: 'تم',
        text: 'تم تحديث معلومات المتجر بنجاح',
        icon: 'success',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
      setShop((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      console.error('Error updating shop:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: err.response?.data?.message || 'فشل في تحديث بيانات المتجر',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
    } finally {
      setLoading(false);
    }
  }, [shop, accessToken]);

  const addAddress = useCallback(async () => {
    if (!accessToken) {
      console.warn('addAddress: Missing accessToken');
      return;
    }
    try {
      await api.post('/api/shops/address', newAddress, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      Swal.fire({
        title: 'تم',
        text: 'تمت إضافة العنوان بنجاح',
        icon: 'success',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
      setNewAddress({
        state: '',
        city: '',
        street: '',
        building: '',
        isDefault: false,
      });
      fetchAddresses();
    } catch (err) {
      console.error('Error adding address:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في إضافة العنوان',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
    }
  }, [newAddress, fetchAddresses, accessToken]);

  const updateAddress = useCallback(async () => {
    if (!accessToken) {
      console.warn('updateAddress: Missing accessToken');
      return;
    }
    try {
      await api.put(`/api/shops/address/${editingAddressId}`, editingAddress, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      Swal.fire({
        title: 'تم',
        text: 'تم تحديث العنوان بنجاح',
        icon: 'success',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
      setEditingAddressId(null);
      setEditingAddress({});
      fetchAddresses();
    } catch (err) {
      console.error('Error updating address:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في تحديث العنوان',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
    }
  }, [editingAddressId, editingAddress, fetchAddresses, accessToken]);

  const deleteAddress = useCallback(async (id) => {
    if (!accessToken) {
      console.warn('deleteAddress: Missing accessToken');
      return;
    }
    const result = await Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن تتمكن من استعادة هذا العنوان بعد الحذف!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/shops/address/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      Swal.fire({
        title: 'تم',
        text: 'تم حذف العنوان بنجاح',
        icon: 'success',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
      fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err.response?.data || err.message);
      Swal.fire({
        title: 'خطأ',
        text: 'فشل في حذف العنوان',
        icon: 'error',
        customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
      });
    }
  }, [fetchAddresses, accessToken]);

  useEffect(() => {
    if (!accessToken || hasFetched.current) {
      if (!accessToken) {
        console.warn('useEffect: Missing accessToken, skipping fetch');
        Swal.fire({
          title: 'خطأ',
          text: 'يرجى تسجيل الدخول لعرض بيانات المتجر',
          icon: 'error',
          customClass: { popup: darkMode ? 'dark:bg-indigo-900 dark:text-indigo-200' : 'bg-indigo-50 text-indigo-800' },
        });
      }
      return;
    }

    console.log('useEffect: Fetching shop and addresses');
    hasFetched.current = true;

    const fetchData = async () => {
      await Promise.all([fetchShop(), fetchAddresses()]);
    };

    fetchData();

    return () => {
      hasFetched.current = false;
    };
  }, [accessToken, fetchShop, fetchAddresses]);

  if (!accessToken) {
    return (
      <div className="min-h-screen font-cairo bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8 text-right">
        <div className="max-w-7xl mx-auto text-center py-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
            يرجى تسجيل الدخول
          </h2>
          <p className="text-indigo-700 dark:text-indigo-200 mt-2">
            تحتاج إلى تسجيل الدخول لعرض وتعديل بيانات المتجر.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-cairo bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8 mt-16 lg:ml-72 sm:ml-24 ml-20 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {loading ? (
        <ShopProfileSkeleton darkMode={darkMode} />
      ) : (
        <div className="max-w-full sm:max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Shop Details */}
          <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-900 rounded-2xl shadow-lg p-4 sm:p-6 text-right">
            <h1 className="text-xl sm:text-2xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
              <FiUser className="text-lg sm:text-xl" /> حسابك
            </h1>
            <div className="space-y-4">
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-300" />
                <input
                  type="text"
                  value={shop.name}
                  onChange={(e) => setShop({ ...shop, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-indigo-100 dark:bg-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                  placeholder="اسم المحل"
                  dir="rtl"
                />
              </div>
              <div className="relative">
                <FiInfo className="absolute left-3 top-3 text-indigo-600 dark:text-indigo-300" />
                <textarea
                  value={shop.description}
                  onChange={(e) => setShop({ ...shop, description: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-indigo-100 dark:bg-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                  placeholder="الوصف"
                  rows="4"
                  dir="rtl"
                />
              </div>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 dark:text-indigo-300" />
                <input
                  type="password"
                  value={shop.password}
                  onChange={(e) => setShop({ ...shop, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-indigo-100 dark:bg-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                  placeholder="كلمة المرور الجديدة"
                  dir="rtl"
                />
              </div>
              <button
                onClick={updateShop}
                disabled={loading}
                className="w-full px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
              >
                {loading ? 'جارٍ التحديث...' : 'تحديث بياناتك'}
              </button>
            </div>
          </div>

          {/* Additional Shop Details */}
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-2xl shadow-lg p-4 sm:p-6 text-right">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
              <FiInfo className="text-lg sm:text-xl" /> تفاصيل المتجر
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FiTag className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>المعرف:</strong> {shop.id || 'غير متوفر'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiMail className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>البريد الإلكتروني:</strong> {shop.email || 'غير متوفر'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>رقم الهاتف:</strong> {shop.phone || 'غير متوفر'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckSquare className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>الحالة:</strong>{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      shop.activate
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    {shop.activate ? 'نشط' : 'غير نشط'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckSquare className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>التحقق:</strong>{' '}
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      shop.verified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    {shop.verified ? 'تم التحقق' : 'غير متحقق'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiStar className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>التقييم:</strong> {shop.rating ? shop.rating.toFixed(1) : 'غير متوفر'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>تاريخ الإنشاء:</strong>{' '}
                  {shop.createdAt
                    ? new Date(shop.createdAt).toLocaleString('ar-EG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'غير متوفر'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>آخر تحديث:</strong>{' '}
                  {shop.updatedAt
                    ? new Date(shop.updatedAt).toLocaleString('ar-EG', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'غير متوفر'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FiTag className="text-indigo-600 dark:text-indigo-300" />
                <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
                  <strong>نوع المتجر:</strong> {shop.shopType || 'غير متوفر'}
                </p>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-2xl shadow-lg p-4 sm:p-6 text-right">
            <h2 className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-6 flex items-center gap-2">
              <FiMapPin className="text-lg sm:text-xl" /> فروع المتجر
            </h2>
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-lg p-4 bg-indigo-100 dark:bg-indigo-800 border border-indigo-200 dark:border-indigo-700 transition-all duration-200 hover:shadow-md"
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
                        className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                        dir="rtl"
                      />
                      <input
                        type="text"
                        value={editingAddress.city}
                        onChange={(e) =>
                          setEditingAddress({ ...editingAddress, city: e.target.value })
                        }
                        placeholder="المدينة"
                        className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                        dir="rtl"
                      />
                      <input
                        type="text"
                        value={editingAddress.street}
                        onChange={(e) =>
                          setEditingAddress({ ...editingAddress, street: e.target.value })
                        }
                        placeholder="الشارع"
                        className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                        dir="rtl"
                      />
                      <input
                        type="text"
                        value={editingAddress.building}
                        onChange={(e) =>
                          setEditingAddress({ ...editingAddress, building: e.target.value })
                        }
                        placeholder="المبنى"
                        className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                        dir="rtl"
                      />
                      <button
                        onClick={updateAddress}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2"
                      >
                        <FiCheckSquare /> حفظ
                      </button>
                      <button
                        onClick={() => setEditingAddressId(null)}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-indigo-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all duration-200 flex items-center gap-2"
                      >
                        <FiX /> إلغاء
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center flex-col sm:flex-row gap-2">
                      <p className="text-indigo-700 dark:text-indigo-200 text-sm sm:text-base">
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
                          className="p-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-all duration-200"
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
                    <svg className="w-12 sm:w-16 h-12 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-200 mb-2">
                    لا توجد عناوين
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-300 text-sm sm:text-base">
                    أضف عنوانًا جديدًا لبدء إدارة فروع المتجر
                  </p>
                </div>
              )}
            </div>

            {/* Add New Address */}
            <div className="mt-6 bg-indigo-100 dark:bg-indigo-800 rounded-lg p-4 sm:p-6 border border-indigo-200 dark:border-indigo-700">
              <h3 className="text-lg sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                <FiMapPin /> إضافة عنوان جديد
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  placeholder="الولاية"
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                  dir="rtl"
                />
                <input
                  type="text"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  placeholder="المدينة"
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                  dir="rtl"
                />
                <input
                  type="text"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  placeholder="الشارع"
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                  dir="rtl"
                />
                <input
                  type="text"
                  value={newAddress.building}
                  onChange={(e) => setNewAddress({ ...newAddress, building: e.target.value })}
                  placeholder="المبنى"
                  className="w-full px-4 py-2.5 bg-indigo-50 dark:bg-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-600 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all duration-300"
                  dir="rtl"
                />
              </div>
              <label className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-300 text-sm sm:text-base">
                <input
                  type="checkbox"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-indigo-600 dark:text-indigo-400"
                />
                اجعل هذا العنوان أساسي
              </label>
              <button
                onClick={addAddress}
                disabled={loading}
                className="w-full px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
              >
                {loading ? 'جارٍ الإضافة...' : 'إضافة عنوان جديد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopProfile;