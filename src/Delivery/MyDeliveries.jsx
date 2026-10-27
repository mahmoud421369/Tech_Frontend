import React, { memo } from "react";
import { FiPackage } from "react-icons/fi";
import { getMyDeliveries, updateOrderStatus } from "../common/api/deliveryApi";
import DeliveryBoard from "./DeliveryBoard";

const STATUSES = {
  DELIVERED: { label: "Delivered", tone: "on", final: true, done: true },
  CANCELLED: { label: "Cancelled", tone: "rd", final: true },
  IN_TRANSIT: { label: "In Transit", tone: "am" },
  READY_FOR_PICKUP: { label: "Ready for Pickup", tone: "em" },
};
const isFinal = (i) => !!STATUSES[i.status]?.final;

const CONFIG = {
  mode: "mine",
  noun: "delivery",
  nounPlural: "deliveries",
  icon: FiPackage,
  title: "My",
  titleAccent: "Deliveries",
  subtitle: "Manage and finalize your delivery assignments",
  docTitle: "My Assigned Deliveries | Tech Restore",
  metaDesc: "Track, manage, and finalize your active assigned courier and technical deliveries on Tech Restore.",
  load: getMyDeliveries,
  priceField: "totalPrice",
  dropField: "userAddress",
  priceLabel: "Order value",
  valueStatLabel: "Total value",
  ageLabel: "Assigned",
  defaultSort: "newest",
  statuses: STATUSES,
  emptyTitle: "No active loads",
  emptyMessage: "Your delivery queue is clear. Orders you accept will show up here.",
  browse: { to: "/delivery/available-orders", label: "Browse available orders" },
  tabs: [
    { key: "all", label: "All" },
    { key: "active", label: "Active", test: (i) => !isFinal(i) },
    { key: "finished", label: "Finished", test: isFinal },
  ],
  actions: {
    primary: {
      label: "Complete", title: "Confirm Delivery?", text: "Mark this order as successfully delivered?", icon: "question",
      confirmText: "Yes, Delivered", confirmColor: "#059669", status: "DELIVERED", call: updateOrderStatus,
      okMsg: "Order marked as delivered", okIcon: "success", failMsg: "Failed to update status",
    },
  },
  ar: {
    noun: "توصيلة",
    nounPlural: "توصيلات",
    title: "توصيلاتي",
    titleAccent: "المسندة",
    subtitle: "أدِر مهام التوصيل المسندة إليك وأنهِها",
    docTitle: "توصيلاتي المسندة | Tech Restore",
    metaDesc: "تابع وأدِر وأنهِ مهام التوصيل المسندة إليك على Tech Restore.",
    priceLabel: "قيمة الطلب",
    valueStatLabel: "إجمالي القيمة",
    ageLabel: "مسند منذ",
    emptyTitle: "لا توجد توصيلات نشطة",
    emptyMessage: "قائمة توصيلاتك فارغة. الطلبات التي تقبلها ستظهر هنا.",
    browse: { to: "/delivery/available-orders", label: "تصفح الطلبات المتاحة" },
    tabLabels: { all: "الكل", active: "نشط", finished: "منتهي" },
    statusLabels: {
      DELIVERED: "تم التوصيل",
      CANCELLED: "ملغي",
      IN_TRANSIT: "في الطريق",
      READY_FOR_PICKUP: "جاهز للاستلام",
    },
    actions: {
      primary: {
        label: "إكمال", title: "تأكيد التوصيل؟", text: "هل تريد تعليم هذا الطلب على أنه تم توصيله بنجاح؟",
        confirmText: "نعم، تم التوصيل", okMsg: "تم تعليم الطلب على أنه مُوصَّل", failMsg: "تعذر تحديث الحالة",
      },
    },
  },
};

const MyDeliveries = () => <DeliveryBoard config={CONFIG} />;

export default memo(MyDeliveries);