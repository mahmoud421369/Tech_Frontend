import React, { memo } from "react";
import { FiTool } from "react-icons/fi";
import { getMyRepairs, updateRepairStatus } from "../common/api/deliveryApi";
import DeliveryBoard from "./DeliveryBoard";

const STATUSES = {
  REPAIR_COMPLETED: { label: "Repair Completed", tone: "on", final: true, done: true },
  DEVICE_DELIVERED: { label: "Device Delivered", tone: "on", final: true, done: true },
  CANCELLED: { label: "Cancelled", tone: "rd", final: true },
  PICKED_UP: { label: "Picked Up", tone: "am" },
  DELIVERED_TO_SHOP: { label: "Delivered to Shop", tone: "em" },
  IN_REPAIR: { label: "In Repair", tone: "gr" },
};
const isFinal = (i) => !!STATUSES[i.status]?.final;

const CONFIG = {
  mode: "mine",
  noun: "repair",
  nounPlural: "repairs",
  icon: FiTool,
  title: "My",
  titleAccent: "Repairs",
  subtitle: "Track device service cycles and manage delivery stages",
  docTitle: "My Assigned Repair Services | Tech Restore",
  metaDesc: "Track, manage, update, and finalize your active assigned technical repair delivery operations on Tech Restore.",
  load: getMyRepairs,
  priceField: "price",
  dropField: "deliveryAddress",
  priceLabel: "Service value",
  valueStatLabel: "Total value",
  ageLabel: "Assigned",
  defaultSort: "newest",
  statuses: STATUSES,
  emptyTitle: "No active repairs",
  emptyMessage: "You have no repair deliveries in progress. Jobs you accept will show up here.",
  browse: { to: "/delivery/available-repair-requests", label: "Browse available repairs" },
  tabs: [
    { key: "all", label: "All" },
    { key: "active", label: "Active", test: (i) => !isFinal(i) },
    { key: "finished", label: "Finished", test: isFinal },
  ],
  actions: {
    primary: {
      label: "Complete", title: "Update Status?", text: "Change repair status to Device Delivered?", icon: "question",
      confirmText: "Confirm", confirmColor: "#059669", status: "DEVICE_DELIVERED", call: updateRepairStatus,
      okMsg: "Repair status updated", okIcon: "success", failMsg: "Failed to update status",
    },
  },
  ar: {
    noun: "عملية صيانة",
    nounPlural: "عمليات صيانة",
    title: "صيانتي",
    titleAccent: "المسندة",
    subtitle: "تابع دورة صيانة الأجهزة وأدِر مراحل التوصيل",
    docTitle: "خدمات الصيانة المسندة إليّ | Tech Restore",
    metaDesc: "تابع وحدّث وأنهِ عمليات توصيل الصيانة الفنية المسندة إليك على Tech Restore.",
    priceLabel: "قيمة الخدمة",
    valueStatLabel: "إجمالي القيمة",
    ageLabel: "مسند منذ",
    emptyTitle: "لا توجد عمليات صيانة نشطة",
    emptyMessage: "لا توجد توصيلات صيانة قيد التنفيذ. المهام التي تقبلها ستظهر هنا.",
    browse: { to: "/delivery/available-repair-requests", label: "تصفح الصيانة المتاحة" },
    tabLabels: { all: "الكل", active: "نشط", finished: "منتهي" },
    statusLabels: {
      REPAIR_COMPLETED: "اكتملت الصيانة",
      DEVICE_DELIVERED: "تم تسليم الجهاز",
      CANCELLED: "ملغي",
      PICKED_UP: "تم الاستلام",
      DELIVERED_TO_SHOP: "سُلّم للمتجر",
      IN_REPAIR: "قيد الصيانة",
    },
    actions: {
      primary: {
        label: "إكمال", title: "تحديث الحالة؟", text: "هل تريد تغيير حالة الصيانة إلى «تم تسليم الجهاز»؟",
        confirmText: "تأكيد", okMsg: "تم تحديث حالة الصيانة", failMsg: "تعذر تحديث الحالة",
      },
    },
  },
};

const MyRepairs = () => <DeliveryBoard config={CONFIG} />;

export default memo(MyRepairs);