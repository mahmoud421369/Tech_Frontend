import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import API from '../api';
import {
  FaCalendar,
  FaCheck,
  FaCreditCard,
  FaMoneyBillWave,
  FaSync,
  FaChevronDown,
  FaHeadset,
  FaCogs,
  FaStore,
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const VALID_SUB_TYPES = ['COMMISSION', 'RATIO'];
const PRICE_PER_MONTH = { COMMISSION: 1200, RATIO: 800 };
const CURRENCY = 'ج.م';

const Subscriptions = () => {
  /* ------------------- STATE ------------------- */
  const [shopEmail, setShopEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [currentSub, setCurrentSub] = useState(null);
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(1);
  const [type, setType] = useState('COMMISSION');
  const [typeOpen, setTypeOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const totalPrice = PRICE_PER_MONTH[type] * duration;
  const hasEverSubscribed = allSubs.length > 0;

  const abortCtrlRef = useRef(null);

  /* ------------------- HELPERS ------------------- */
  const validateEmail = useCallback((value) => {
    if (!value) {
      setEmailError('البريد الإلكتروني مطلوب للتجديد');
      return false;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (re.test(value)) {
      setEmailError('');
      return true;
    }
    setEmailError('البريد الإلكتروني غير صالح');
    return false;
  }, []);

  const handleEmailChange = (e) => {
    const val = e.target.value.trim();
    setShopEmail(val);
    if (val) validateEmail(val);
  };

  const getConfig = useCallback(() => {
    if (!abortCtrlRef.current) {
      abortCtrlRef.current = new AbortController();
    }
    return { signal: abortCtrlRef.current.signal };
  }, []);

  const formatDate = useCallback((dateStr) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const isActive = useCallback((end) => new Date(end) > new Date(), []);

  const createPayload = useCallback(
    () => ({
      months: duration,
      type: type.toUpperCase(),
    }),
    [duration, type]
  );

  /* ------------------- ERROR HANDLER ------------------- */
  const handleApiError = (err, fallbackMsg) => {
    if (err.name === 'AbortError') return;

    const message =
      err?.response?.data?.message ||
      err?.message ||
      fallbackMsg;

    toast.error(message);
  };

  /* ------------------- FETCH ------------------- */
  const fetchCurrentSubscription = useCallback(async () => {
    const config = getConfig();
    const id = toast.loading('جاري تحميل الاشتراك الحالي...');
    try {
      const res = await API.get('/api/subscriptions', config);
      setCurrentSub(res.data?.content?.[0] ?? null);
      toast.update(id, {
        render: 'تم تحميل الاشتراك الحالي',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      handleApiError(err, 'فشل تحميل الاشتراك الحالي');
      toast.dismiss(id);
    }
  }, [getConfig]);

  const fetchAllSubscriptions = useCallback(async () => {
    const config = getConfig();
    const id = toast.loading('جاري تحميل سجل الاشتراكات...');
    try {
      const res = await API.get('/api/subscriptions/all', config);
      const list = Array.isArray(res.data?.content)
        ? res.data.content
        : res.data ?? [];
      setAllSubs(list);
      toast.update(id, {
        render: 'تم تحميل السجل',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
    } catch (err) {
      handleApiError(err, 'فشل تحميل سجل الاشتراكات');
      toast.dismiss(id);
    }
  }, [getConfig]);

  const refetch = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchCurrentSubscription(),
      fetchAllSubscriptions(),
    ]).finally(() => setLoading(false));
  }, [fetchCurrentSubscription, fetchAllSubscriptions]);

  /* ------------------- MOUNT ------------------- */
  useEffect(() => {
    abortCtrlRef.current?.abort();
    abortCtrlRef.current = new AbortController();

    refetch();

    return () => {
      abortCtrlRef.current?.abort();
    };
  }, [refetchTrigger, refetch]);

  /* ------------------- PAYMENT ------------------- */
  const subscribeCard = async () => {
    if (!window.confirm(` ${duration} شهر – ${totalPrice} ${CURRENCY}`)) return;

    const config = getConfig();
    const id = toast.loading('جاري إنشاء دفع بطاقة...');
    try {
      const res = await API.post('/api/subscriptions/card', createPayload(), config);
      toast.update(id, {
        render:` تم إنشاء الدفع (ID: ${res.data.paymentId})`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      window.location.href = res.data.paymentUrl;
    } catch (err) {
      handleApiError(err, 'فشل إنشاء دفع بطاقة');
      toast.dismiss(id);
    }
  };

  const subscribeCash = async () => {
    if (!window.confirm(` ${duration} شهر – ${totalPrice} ${CURRENCY}`)) return;

    const config = getConfig();
    const id = toast.loading('جاري إرسال طلب نقدي...');
    try {
      await API.post('/api/subscriptions/cash', createPayload(), config);
      toast.update(id, {
        render: 'تم إرسال طلب الدفع النقدي',
        type: 'success',
        isLoading: false,
        autoClose: 2500,
      });
      setRefetchTrigger((v) => v + 1);
    } catch (err) {
      handleApiError(err, 'فشل إرسال طلب نقدي');
      toast.dismiss(id);
    }
  };

  const renewCard = async () => {
    if (!validateEmail(shopEmail)) return;
    if (!window.confirm(`: ${duration} شهر – ${totalPrice} ${CURRENCY}`)) return;

    const config = getConfig();
    const id = toast.loading('جاري إنشاء تجديد بطاقة...');
    try {
      const res = await API.post(`/api/subscriptions/renew/card/${shopEmail}`, createPayload(), config);
      toast.update(id, {
        render:` تم إنشاء التجديد (ID: ${res.data.paymentId})`,
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      window.location.href = res.data.paymentUrl;
    } catch (err) {
      handleApiError(err, 'فشل إنشاء تجديد');
      toast.dismiss(id);
    }
  };

  const renewCash = async () => {
    if (!validateEmail(shopEmail)) return;
    if (!window.confirm(` ${duration} شهر – ${totalPrice} ${CURRENCY}`)) return;

    const config = getConfig();
    const id = toast.loading('جاري إرسال طلب تجديد نقدي...');
    try {
      await API.post(`/api/subscriptions/renew/cash/${shopEmail}`, createPayload(), config);
      toast.update(id, {
        render: 'تم إرسال طلب التجديد النقدي',
        type: 'success',
        isLoading: false,
        autoClose: 2500,
      });
      setRefetchTrigger((v) => v + 1);
    } catch (err) {
      handleApiError(err, 'فشل إرسال طلب تجديد نقدي');
      toast.dismiss(id);
    }
  };

  /* ------------------- UI ------------------- */
  const durationOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => i + 1),
    []
  );

  return (
    <div dir="rtl" style={{marginLeft:"-25px",marginTop:"-600px"}} className="min-h-screen max-w-6xl mx-auto p-4 lg:p-8 font-cairo bg-gradient-to-br from-gray-50 via-white to-white">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-right bg-white p-6  shadow-sm border-l-4 border-lime-500">
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center justify-start gap-3">
            <FaCalendar className="text-gray-500" />
            إدارة الاشتراكات
          </h1>
          <p className="text-sm text-gray-600">
            اختر خطتك أو جدد اشتراكك بسهولة
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl border  shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-start gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FaStore className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">إدارة كاملة</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">
              تحكم كامل في المتجر، المنتجات، الطلبات، والمحادثات.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl border  shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-start gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FaHeadset className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">دعم 24/7</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">
              فريق دعم متاح على مدار الساعة لحل أي مشكلة.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl border  shadow-sm hover:shadow-md transition group">
            <div className="flex items-center justify-start gap-3 mb-3">
              <div className="p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition">
                <FaCogs className="w-6 h-6 text-lime-700" />
              </div>
              <h3 className="text-lg font-bold text-black">تحديثات تلقائية</h3>
            </div>
            <p className="text-sm text-gray-600 text-right">
              تحديثات مجانية وميزات جديدة دون تكلفة إضافية.
            </p>
          </div>
        </div>

        {/* Email */}
        <div className="max-w-md mx-auto mb-8">
          <label className="block text-sm font-medium text-black mb-2">
            بريد المتجر (مطلوب للتجديد)
          </label>
          <input
            type="email"
            value={shopEmail}
            onChange={handleEmailChange}
            placeholder="example@shop.com"
            className={`w-full px-4 py-3 rounded-lg border ${emailError ? 'border-red-400' : ''} bg-gray-50 text-black placeholder-gray-500 focus:ring-2 focus:ring-lime-400 focus:border-lime-500 outline-none transition text-right`}
          />
          {emailError && (
            <p className="mt-1 text-sm text-red-600 text-right">{emailError}</p>
          )}
        </div>

        {/* Plan Card */}
        <div className="max-w-lg mx-auto">
          <div className="rounded-xl p-6 shadow-sm bg-white border ">
            <div className="flex justify-center mb-5">
              <div className="p-3 bg-lime-100 text-lime-700 rounded-full">
                <FaCalendar className="w-7 h-7" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-black mb-5">
              {hasEverSubscribed ? 'تجديد أو اشتراك جديد' : 'اختر خطة مدفوعة'}
            </h2>

            {/* Type Dropdown */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-black mb-2">
                نوع الاشتراك
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTypeOpen(!typeOpen)}
                  className="w-full px-4 py-3 bg-gray-50 border  rounded-lg flex justify-between items-center hover:border-lime-500 transition text-right"
                >
                  <span>
                    {type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'} (
                    {PRICE_PER_MONTH[type]} {CURRENCY}/شهر)
                  </span>
                  <FaChevronDown className={`transition ${typeOpen ? 'rotate-180' : ''}`} />
                </button>
                {typeOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-lime-200 rounded-lg shadow-lg">
                    {VALID_SUB_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setTypeOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm"
                      >
                        {t === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'} (
                        {PRICE_PER_MONTH[t]} {CURRENCY}/شهر)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Duration Dropdown */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-black mb-2">
                المدة
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDurationOpen(!durationOpen)}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-lg flex justify-between items-center hover:border-lime-500 transition text-right"
                >
                  <span>
                    {duration} شهر{duration === 12 ? ' (سنة كاملة)' : ''}
                  </span>
                  <FaChevronDown className={`transition ${durationOpen ? 'rotate-180' : ''}`} />
                </button>
                {durationOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-lime-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {durationOptions.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setDuration(m);
                          setDurationOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-right hover:bg-lime-50 transition text-sm"
                      >
                        {m} شهر{m === 12 ? ' (سنة كاملة)' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-lime-600">
                {totalPrice} {CURRENCY}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {PRICE_PER_MONTH[type]} {CURRENCY} × {duration} شهر
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6 text-sm text-right text-gray-700">
              <li className="flex items-center gap-2 justify-start">
                <FaCheck className="w-5 h-5 text-lime-600" />
                <span>إدارة كاملة للمتجر</span>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <FaCheck className="w-5 h-5 text-lime-600" />
                <span>دعم فني 24/7</span>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <FaCheck className="w-5 h-5 text-lime-600" />
                <span>تحديثات مجانية</span>
              </li>
            </ul>

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* {!hasEverSubscribed && (
                <>
                  <button
                    onClick={subscribeCard}
                    className="flex items-center justify-center gap-2 py-3 font-bold rounded-lg bg-lime-500 hover:bg-lime-600 text-white transition shadow-sm"
                  >
                    <FaCreditCard /> بطاقة
                  </button>
                  <button
                    onClick={subscribeCash}
                    className="flex items-center justify-center gap-2 py-3 font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white transition shadow-sm"
                  >
                    <FaMoneyBillWave /> نقدي
                  </button>
                </>
              )} */}
              <button
                onClick={subscribeCard}
                className="flex items-center justify-center gap-2 py-3 font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition shadow-sm"
              >
                <FaSync /> تجديد بطاقة
              </button>
              <button
                onClick={subscribeCash}
                className="flex items-center justify-center gap-2 py-3 font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm"
              >
                <FaSync /> تجديد نقدي
              </button>
            </div>
          </div>
        </div>

        {/* Current Subscription */}
        <div className="mt-12 max-w-6xl mx-auto bg-gray-50 border p-4 rounded-lg ">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center justify-start gap-2">
            الاشتراك الحالي
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !currentSub ? (
            <p className="text-center text-gray-600 py-6">
              لا يوجد اشتراك نشط حاليًا.
            </p>
          ) : (
            <div className="border border-lime-200 p-5 rounded-xl bg-gradient-to-r from-lime-50 to-white">
              <p className="font-medium text-black">
                النوع:{' '}
                <span className="text-lime-700">
                  {currentSub.type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                من: {formatDate(currentSub.startDate)} إلى {formatDate(currentSub.endDate)}
              </p>
              <p className="text-sm text-gray-600">
                المبلغ: {currentSub.totalAmount} {CURRENCY}
              </p>
              <span
                className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                  isActive(currentSub.endDate)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isActive(currentSub.endDate) ? 'نشط' : 'منتهي'}
              </span>
            </div>
          )}
        </div>

        {/* History */}
        <div className="mt-12 max-w-6xl mx-auto bg-gray-50 border p-4 rounded-lg">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center justify-start gap-2">
            سجل الاشتراكات
          </h2>
          {allSubs.length === 0 ? (
            <p className="text-center text-gray-600 py-6">
              لا توجد اشتراكات سابقة.
            </p>
          ) : (
            <div className="space-y-3">
              {allSubs.map((s) => (
                <div
                  key={s.id}
                  className="border border-lime-200 p-4 rounded-xl bg-gradient-to-r from-lime-50 to-white flex justify-between items-center"
                >
                  <div className="text-right">
                    <p className="font-medium text-black">
                      {s.type === 'COMMISSION' ? 'نسبة عمولة' : 'مبلغ ثابت'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(s.startDate)} - {formatDate(s.endDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      المبلغ: {s.totalAmount} {CURRENCY}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isActive(s.endDate)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isActive(s.endDate) ? 'نشط' : 'منتهي'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;