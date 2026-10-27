import React, { memo } from "react";
import { FiTool } from "react-icons/fi";
import { getAvailableRepairs, acceptRepair, rejectRepair } from "../common/api/deliveryApi";
import DeliveryBoard from "./DeliveryBoard";

const hours = (i) => (Date.now() - (Date.parse(i.createdAt) || Date.now())) / 3600000;

const CONFIG = {
  mode: "available",
  noun: "repair job",
  nounPlural: "repair jobs",
  icon: FiTool,
  title: "Available",
  titleAccent: "Repairs",
  subtitle: "Claim repair deliveries from the active queue",
  docTitle: "Available Repair Deliveries | Tech Restore",
  metaDesc: "Claim pending technician repair deliveries in the live operational dispatch queue on Tech Restore.",
  load: getAvailableRepairs,
  priceField: "price",
  dropField: "deliveryAddress",
  priceLabel: "Service value",
  valueStatLabel: "Total value",
  ageLabel: "Waiting",
  emptyTitle: "All clear",
  emptyMessage: "No repair jobs are waiting right now. New jobs appear here automatically.",
  tabs: [
    { key: "all", label: "All" },
    { key: "fresh", label: "Under 6h", test: (i) => hours(i) < 6 },
    { key: "late", label: "Waiting 6h+", test: (i) => hours(i) >= 6 },
  ],
  actions: {
    primary: {
      label: "Accept", title: "Accept Repair Job?", text: "This repair request will be assigned to you for delivery.", icon: "question",
      confirmText: "Accept Now", confirmColor: "#059669", call: acceptRepair,
      okMsg: "Repair job accepted successfully", okIcon: "success", failMsg: "Failed to accept repair job",
    },
    secondary: {
      label: "Reject", title: "Reject Repair Job?", text: "Pass on this repair delivery?", icon: "warning",
      confirmText: "Yes, Reject", confirmColor: "#ef4444", call: rejectRepair,
      okMsg: "Repair job rejected", okIcon: "info", failMsg: "Failed to reject repair job",
    },
  },
  ar: {
    noun: "مهمة صيانة",
    nounPlural: "مهام صيانة",
    title: "الصيانة",
    titleAccent: "المتاحة",
    subtitle: "استلم توصيلات الصيانة من الطابور النشط",
    docTitle: "توصيلات الصيانة المتاحة | Tech Restore",
    metaDesc: "استلم توصيلات الصيانة المعلقة الخاصة بالفنيين من طابور الإسناد المباشر على Tech Restore.",
    priceLabel: "قيمة الخدمة",
    valueStatLabel: "إجمالي القيمة",
    ageLabel: "بانتظار",
    emptyTitle: "لا يوجد شيء معلق",
    emptyMessage: "لا توجد مهام صيانة بانتظار الإسناد الآن. ستظهر المهام الجديدة هنا تلقائيًا.",
    tabLabels: { all: "الكل", fresh: "أقل من 6 س", late: "انتظار +6 س" },
    actions: {
      primary: {
        label: "قبول", title: "قبول مهمة الصيانة؟", text: "سيتم إسناد طلب الصيانة هذا إليك للتوصيل.",
        confirmText: "اقبل الآن", okMsg: "تم قبول مهمة الصيانة بنجاح", failMsg: "تعذر قبول مهمة الصيانة",
      },
      secondary: {
        label: "رفض", title: "رفض مهمة الصيانة؟", text: "هل تريد تجاوز توصيل الصيانة هذا؟",
        confirmText: "نعم، ارفض", okMsg: "تم رفض مهمة الصيانة", failMsg: "تعذر رفض مهمة الصيانة",
      },
    },
  },
};

const AvailableRepairs = () => <DeliveryBoard config={CONFIG} />;

export default memo(AvailableRepairs);