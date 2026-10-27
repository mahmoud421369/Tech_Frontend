import React, { useEffect, useState, useCallback, useMemo, useRef, memo } from "react";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiEdit3, FiCheck, FiShield,
  FiTrendingUp, FiAward, FiTool, FiSettings, FiAlertTriangle, FiX,
} from "react-icons/fi";
import { getDeliveryProfile, updateDeliveryProfile } from "../common/api/deliveryApi";
import { UI3D_CSS, Defs3D } from "../components/user/Ui3D";
import { EXTRAS_CSS, Toaster, toast } from "../components/user/UiExtras";
import {
  CARD, PANEL, FIELD, LABEL, BTN_MD, BTN_PRIMARY, SCROLL_CSS, useDarkMode, IconTile,
} from "../components/shop/TableKit";
import { useAppLanguage } from "../common/utils/useAppLanguage";
import { getFontStyle, ensureShopAssets } from "../common/utils/shopFonts";

ensureShopAssets();

const PAGE_CSS = UI3D_CSS + EXTRAS_CSS + SCROLL_CSS;
const INK = "#04261a";
const EMPTY_FORM = { name: "", address: "", phone: "" };

const EN = {
  locale: "en-US",
  docTitle: "Delivery Agent Profile | Tech Restore",
  metaDesc: "Manage your Tech Restore delivery dispatcher profile, secure credentials, phone number, operating area and career analytics.",
  title: "My",
  titleAccent: "Profile",
  subtitle: "Manage your agent details and see your delivery totals",
  agent: "Delivery Agent",
  summaryAria: "Agent summary",
  active: "Active agent",
  verified: "Verified",
  edit: "Edit profile",
  editAria: "Edit profile details",
  statsAria: "Statistics",
  stats: {
    orders: { label: "Active orders", desc: "On the road now" },
    repairs: { label: "Active repairs", desc: "Device runs in progress" },
    total: { label: "Total deliveries", desc: "Completed so far" },
    status: { label: "Account status", desc: "Set by dispatch" },
  },
  statusNames: { ACTIVE: "Active", INACTIVE: "Inactive", SUSPENDED: "Suspended", PENDING: "Pending" },
  account: "Account details",
  accountHint: "Your contact info and operating address",
  email: "Email",
  joined: "Joined on",
  name: "Display name",
  phone: "Phone",
  address: "Address",
  cancel: "Cancel",
  save: "Save changes",
  saveAria: "Save profile changes",
  saving: "Saving...",
  loadingAria: "Loading profile",
  loadFailTitle: "Couldn't load your profile",
  loadFailHint: "Check your connection and try again.",
  unavailable: "Your profile is not available right now.",
  retry: "Try again",
  errors: {
    name: "Name is required",
    address: "Address is required",
    phone: "Phone is required",
    phoneFormat: "Invalid phone format",
  },
  toasts: { loadFail: "Failed to load profile", saved: "Profile updated successfully", saveFail: "Update failed" },
};

const AR = {
  locale: "ar-EG",
  docTitle: "ملف مندوب التوصيل | Tech Restore",
  metaDesc: "أدِر ملف مندوب التوصيل في Tech Restore، ورقم هاتفك ومنطقة عملك وإحصاءات أدائك.",
  title: "ملفي",
  titleAccent: "الشخصي",
  subtitle: "أدِر بيانات المندوب وتابع إجمالي توصيلاتك",
  agent: "مندوب توصيل",
  summaryAria: "ملخص المندوب",
  active: "مندوب نشط",
  verified: "موثّق",
  edit: "تعديل الملف",
  editAria: "تعديل بيانات الملف الشخصي",
  statsAria: "الإحصاءات",
  stats: {
    orders: { label: "الطلبات الجارية", desc: "في الطريق الآن" },
    repairs: { label: "الصيانة الجارية", desc: "نقل أجهزة قيد التنفيذ" },
    total: { label: "إجمالي التوصيلات", desc: "المكتملة حتى الآن" },
    status: { label: "حالة الحساب", desc: "يحددها فريق الإدارة" },
  },
  statusNames: { ACTIVE: "نشط", INACTIVE: "غير نشط", SUSPENDED: "موقوف", PENDING: "قيد المراجعة" },
  account: "بيانات الحساب",
  accountHint: "بيانات التواصل وعنوان العمل",
  email: "البريد الإلكتروني",
  joined: "تاريخ الانضمام",
  name: "الاسم المعروض",
  phone: "رقم الهاتف",
  address: "العنوان",
  cancel: "إلغاء",
  save: "حفظ التغييرات",
  saveAria: "حفظ تغييرات الملف الشخصي",
  saving: "جارٍ الحفظ...",
  loadingAria: "جارٍ تحميل الملف الشخصي",
  loadFailTitle: "تعذر تحميل ملفك الشخصي",
  loadFailHint: "تحقق من اتصالك وحاول مرة أخرى.",
  unavailable: "ملفك الشخصي غير متاح حاليًا.",
  retry: "حاول مرة أخرى",
  errors: {
    name: "الاسم مطلوب",
    address: "العنوان مطلوب",
    phone: "رقم الهاتف مطلوب",
    phoneFormat: "صيغة رقم الهاتف غير صحيحة",
  },
  toasts: { loadFail: "تعذر تحميل الملف الشخصي", saved: "تم تحديث الملف الشخصي بنجاح", saveFail: "فشل التحديث" },
};

const FMT_CACHE = {};
const getFmt = (locale) =>
  (FMT_CACHE[locale] ||= {
    num: new Intl.NumberFormat(locale),
    date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }),
  });

const CTRL = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
const txt = (v) => (typeof v === "string" || typeof v === "number" ? String(v).replace(CTRL, "") : "");
const toForm = (p) => ({ name: txt(p?.name), address: txt(p?.address), phone: txt(p?.phone) });
const formatLongDate = (d, fmt) => {
  const date = d ? new Date(d) : null;
  return date && !Number.isNaN(date.getTime()) ? fmt.date.format(date) : "—";
};

const StatCard = memo(({ label, value, description, icon, tone }) => (
  <div className={`${CARD} min-w-0 p-4`}>
    <div className="flex items-center gap-3">
      <IconTile icon={icon} tone={tone} className="h-11 w-11 flex-shrink-0" size={19} />
      <div className="min-w-0">
        <p className="nb-muted truncate text-[10px] font-bold uppercase">{label}</p>
        <p className="truncate text-xl font-extrabold leading-tight tabular-nums">{value}</p>
      </div>
    </div>
    <p className="nb-muted mt-3 truncate text-[11px] font-semibold">{description}</p>
  </div>
));

const InfoRow = memo(({ icon: Icon, label, value }) => (
  <div className={`${PANEL} flex items-center gap-3 p-3`}>
    <span className="nb-tile h-9 w-9"><Icon size={16} aria-hidden="true" /></span>
    <div className="min-w-0">
      <p className="nb-muted text-[10px] font-extrabold uppercase">{label}</p>
      <p className="truncate text-sm font-extrabold">{value || "—"}</p>
    </div>
  </div>
));

const Field = memo(({ id, icon: Icon, label, field, value, editing, onChange, error, type = "text", inputMode, autoComplete, maxLength, dir }) => (
  <div>
    <label htmlFor={id} className={`${LABEL} flex items-center gap-2`}>
      <Icon size={14} className="nb-ic flex-shrink-0" aria-hidden="true" /> {label}
    </label>
    <input
      id={id}
      type={type}
      dir={dir}
      inputMode={inputMode}
      autoComplete={autoComplete}
      maxLength={maxLength}
      value={value}
      disabled={!editing}
      onChange={(e) => onChange(field, e.target.value)}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`${FIELD} h-11 w-full text-base font-semibold sm:text-sm disabled:cursor-not-allowed disabled:opacity-70 ${error ? "!border-red-500" : ""}`}
    />
    {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-bold text-red-600 dark:text-red-300">{error}</p>}
  </div>
));

const Skeleton = memo(({ label }) => (
  <div className="mx-auto max-w-5xl animate-pulse space-y-5 px-4 motion-reduce:animate-none sm:px-6" aria-busy="true" aria-label={label}>
    <div className="nb-gray nb-line h-9 w-56 border-2" />
    <div className={`${CARD} nb-gray h-36`} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className={`${CARD} nb-gray h-28`} />)}
    </div>
    <div className={`${CARD} nb-gray h-72`} />
  </div>
));

const DeliveryProfile = ({ darkMode: darkModeProp }) => {
  const hookDark = useDarkMode();
  const darkMode = darkModeProp ?? hookDark;
  const language = useAppLanguage();
  const isAr = language === "ar";
  const t = isAr ? AR : EN;
  const dir = isAr ? "rtl" : "ltr";
  const font = useMemo(() => getFontStyle(language), [language]);
  const f = getFmt(t.locale);

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [errors, setErrors] = useState({});
  const mountedRef = useRef(true);
  const formCardRef = useRef(null);
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  useEffect(() => {
    document.title = t.docTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = t.metaDesc;
  }, [t.docTitle, t.metaDesc]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const data = await getDeliveryProfile();
      if (!mountedRef.current) return;
      setProfile(data);
      setForm(toForm(data));
    } catch {
      if (!mountedRef.current) return;
      setLoadError(true);
      toast({ icon: "error", title: tRef.current.toasts.loadFail });
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const validate = useCallback(() => {
    const e = {};
    const m = tRef.current.errors;
    const name = form.name.trim();
    const address = form.address.trim();
    const phone = form.phone.replace(/[\s-]/g, "");
    if (!name) e.name = m.name;
    if (!address) e.address = m.address;
    if (!phone) e.phone = m.phone;
    else if (!/^\+?\d{10,15}$/.test(phone)) e.phone = m.phoneFormat;
    setErrors(e);
    return Object.keys(e).length === 0 ? { name, address, phone } : null;
  }, [form]);

  const handleUpdate = useCallback(async () => {
    if (isSaving) return;
    const payload = validate();
    if (!payload) return;
    setIsSaving(true);
    try {
      await updateDeliveryProfile(payload);
      const updated = await getDeliveryProfile();
      if (!mountedRef.current) return;
      setProfile(updated);
      setForm(toForm(updated));
      setIsEditing(false);
      toast({ icon: "success", title: tRef.current.toasts.saved });
    } catch (err) {
      toast({ icon: "error", title: String(err?.response?.data?.message || "").slice(0, 120) || tRef.current.toasts.saveFail });
    } finally {
      if (mountedRef.current) setIsSaving(false);
    }
  }, [isSaving, validate]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("profile-name")?.focus({ preventScroll: true });
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setForm(toForm(profile));
    setErrors({});
    setIsEditing(false);
  }, [profile]);

  const onSubmit = useCallback((e) => { e.preventDefault(); handleUpdate(); }, [handleUpdate]);

  const displayName = txt(profile?.name) || t.agent;
  const statusKey = txt(profile?.status).toUpperCase() || "ACTIVE";
  const statusLabel = t.statusNames[statusKey] || statusKey;

  let content;
  if (isLoading && !profile) {
    content = <Skeleton label={t.loadingAria} />;
  } else if (!profile) {
    content = (
      <main className="mx-auto max-w-md px-4">
        <div role="alert" className={`${CARD} flex flex-col items-center px-6 py-12 text-center`}>
          <span className="nb-tile nb-tile-danger h-14 w-14"><FiAlertTriangle size={26} aria-hidden="true" /></span>
          <h1 className="mt-4 text-lg font-extrabold uppercase"><span className="nb-ul">{t.loadFailTitle}</span></h1>
          <p className="nb-muted mt-2 text-xs font-semibold">{loadError ? t.loadFailHint : t.unavailable}</p>
          <button type="button" onClick={loadProfile} className={`${BTN_PRIMARY} mt-5 h-11 px-6 text-sm uppercase`}>{t.retry}</button>
        </div>
      </main>
    );
  } else {
    content = (
      <div key={language} className="lang-fade mx-auto max-w-5xl space-y-5 px-4 sm:px-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight rtl:tracking-normal sm:text-3xl">
            {t.title} <span className="nb-ul">{t.titleAccent}</span>
          </h1>
          <p className="nb-muted mt-2 text-xs font-semibold">{t.subtitle}</p>
        </div>

        <section aria-label={t.summaryAria} className={`${CARD} flex flex-col items-center gap-5 p-5 text-center sm:flex-row sm:p-6 sm:text-start`}>
          <div className="relative flex-shrink-0">
            <span className="nb-tile h-20 w-20 text-3xl font-extrabold uppercase">{displayName.charAt(0)}</span>
            <span className="nb-tile absolute -bottom-2 -end-2 h-8 w-8"><FiShield size={14} aria-hidden="true" /></span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-extrabold">{displayName}</h2>
            <p className="nb-muted truncate text-sm font-semibold" dir="ltr">{txt(profile.email)}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="nb-chip !normal-case" style={{ background: "#34d399", color: INK }}>{t.active}</span>
              {profile.verified && (
                <span className="nb-chip !normal-case"><FiCheck size={11} aria-hidden="true" /> {t.verified}</span>
              )}
            </div>
          </div>
          {!isEditing && (
            <button type="button" onClick={startEditing} aria-label={t.editAria} className={`${BTN_PRIMARY} h-11 w-full px-5 text-sm uppercase sm:w-auto`}>
              <FiEdit3 size={15} aria-hidden="true" /> {t.edit}
            </button>
          )}
        </section>

        <section aria-label={t.statsAria} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t.stats.orders.label} value={f.num.format(Number(profile.activeOrderDeliveries) || 0)} description={t.stats.orders.desc} icon={FiTrendingUp} tone="em" />
          <StatCard label={t.stats.repairs.label} value={f.num.format(Number(profile.activeRepairDeliveries) || 0)} description={t.stats.repairs.desc} icon={FiTool} tone="te" />
          <StatCard label={t.stats.total.label} value={f.num.format(Number(profile.totalCompletedDeliveries) || 0)} description={t.stats.total.desc} icon={FiAward} tone="sky" />
          <StatCard label={t.stats.status.label} value={statusLabel} description={t.stats.status.desc} icon={FiShield} tone="vi" />
        </section>

        <section ref={formCardRef} aria-labelledby="account-title" className={`${CARD} scroll-mt-24 p-5 sm:p-6`}>
          <div className="mb-5 flex items-center gap-3">
            <IconTile icon={FiSettings} tone="em" className="h-10 w-10 flex-shrink-0" size={18} />
            <div className="min-w-0">
              <h2 id="account-title" className="text-sm font-extrabold uppercase"><span className="nb-ul">{t.account}</span></h2>
              <p className="nb-muted mt-1.5 text-[11px] font-semibold">{t.accountHint}</p>
            </div>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <InfoRow icon={FiMail} label={t.email} value={txt(profile.email)} />
            <InfoRow icon={FiClock} label={t.joined} value={formatLongDate(profile.createdAt, f)} />
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="profile-name" icon={FiUser} label={t.name} field="name" value={form.name} editing={isEditing} onChange={handleChange} error={errors.name} autoComplete="name" maxLength={80} />
              <Field id="profile-phone" icon={FiPhone} label={t.phone} field="phone" type="tel" inputMode="tel" dir="ltr" value={form.phone} editing={isEditing} onChange={handleChange} error={errors.phone} autoComplete="tel" maxLength={20} />
            </div>
            <Field id="profile-address" icon={FiMapPin} label={t.address} field="address" value={form.address} editing={isEditing} onChange={handleChange} error={errors.address} autoComplete="street-address" maxLength={200} />

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cancelEdit} disabled={isSaving} className={`${BTN_MD} h-11 flex-1 text-sm uppercase`}>
                  <FiX size={15} aria-hidden="true" /> {t.cancel}
                </button>
                <button type="submit" disabled={isSaving} aria-label={t.saveAria} className={`${BTN_PRIMARY} h-11 flex-[1.6] text-sm uppercase`}>
                  <FiCheck size={16} aria-hidden="true" /> {isSaving ? t.saving : t.save}
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    );
  }

  return (
    <div dir={dir} lang={language} style={font} className="nb-page mt-16 min-h-screen py-6 text-start lg:ps-64">
      <style>{PAGE_CSS}</style>
      <Defs3D />
      <Toaster darkMode={darkMode} />
      {content}
    </div>
  );
};

export default memo(DeliveryProfile);