import React, { memo } from "react";
import { FiPackage } from "react-icons/fi";
import { getAvailableOrders, acceptOrder, rejectOrder } from "../common/api/deliveryApi";
import DeliveryBoard from "./DeliveryBoard";

const hours = (i) => (Date.now() - (Date.parse(i.createdAt) || Date.now())) / 3600000;

const CONFIG = {
  mode: "available",
  noun: "order",
  nounPlural: "orders",
  icon: FiPackage,
  title: "Available",
  titleAccent: "Orders",
  subtitle: "Claim new delivery tasks from the live queue",
  docTitle: "Available Orders | Tech Restore",
  metaDesc: "View and accept available technical and customer delivery orders waiting in the queue on Tech Restore.",
  load: getAvailableOrders,
  priceField: "totalPrice",
  dropField: "userAddress",
  priceLabel: "Order value",
  valueStatLabel: "Total value",
  ageLabel: "Waiting",
  emptyTitle: "Queue is empty",
  emptyMessage: "No orders are waiting for assignment. New orders appear here automatically.",
  tabs: [
    { key: "all", label: "All" },
    { key: "fresh", label: "Under 6h", test: (i) => hours(i) < 6 },
    { key: "late", label: "Waiting 6h+", test: (i) => hours(i) >= 6 },
  ],
  actions: {
    primary: {
      label: "Accept", title: "Accept Delivery?", text: "This order will be assigned to you.", icon: "question",
      confirmText: "Accept Now", confirmColor: "#059669", call: acceptOrder,
      okMsg: "Order accepted successfully", okIcon: "success", failMsg: "Failed to accept order",
    },
    secondary: {
      label: "Reject", title: "Reject Order?", text: "Are you sure you want to pass on this order?", icon: "warning",
      confirmText: "Yes, Reject", confirmColor: "#ef4444", call: rejectOrder,
      okMsg: "Order rejected", okIcon: "info", failMsg: "Failed to reject order",
    },
  },
  ar: {
    noun: "طلب",
    nounPlural: "طلبات",
    title: "الطلبات",
    titleAccent: "المتاحة",
    subtitle: "استلم مهام توصيل جديدة من الطابور المباشر",
    docTitle: "الطلبات المتاحة | Tech Restore",
    metaDesc: "اعرض واقبل طلبات التوصيل المتاحة التي تنتظر في الطابور على Tech Restore.",
    priceLabel: "قيمة الطلب",
    valueStatLabel: "إجمالي القيمة",
    ageLabel: "بانتظار",
    emptyTitle: "الطابور فارغ",
    emptyMessage: "لا توجد طلبات بانتظار الإسناد. ستظهر الطلبات الجديدة هنا تلقائيًا.",
    tabLabels: { all: "الكل", fresh: "أقل من 6 س", late: "انتظار +6 س" },
    actions: {
      primary: {
        label: "قبول", title: "قبول التوصيل؟", text: "سيتم إسناد هذا الطلب إليك.",
        confirmText: "اقبل الآن", okMsg: "تم قبول الطلب بنجاح", failMsg: "تعذر قبول الطلب",
      },
      secondary: {
        label: "رفض", title: "رفض الطلب؟", text: "هل أنت متأكد أنك تريد تجاوز هذا الطلب؟",
        confirmText: "نعم، ارفض", okMsg: "تم رفض الطلب", failMsg: "تعذر رفض الطلب",
      },
    },
  },
};

const AvailableOrders = () => <DeliveryBoard config={CONFIG} />;

export default memo(AvailableOrders);