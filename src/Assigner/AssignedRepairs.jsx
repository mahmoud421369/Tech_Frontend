import React, { memo } from "react";
import { FiTool } from "react-icons/fi";
import { AssignedQueue } from "./AssignedOrders";

const REPAIRS_ASSIGNED_CONFIG = Object.freeze({
  noun: "repair",
  nounPlural: "repairs",
  icon: FiTool,
  title: "Assigned",
  titleAccent: "Repairs",
  subtitle: "Look up the tasks assigned to a delivery agent",
  docTitle: "Assigner - Assigned Repairs | Tech Restore",
  currentPath: (id) => `/api/assigner/delivery/${encodeURIComponent(id)}/repairs`,
  logType: "REPAIR",
  logIdField: "repairRequestId",
  priceField: "price",
  priceLabel: "Est. price",
  valueStatLabel: "Est. revenue",
  stopLabels: Object.freeze({ pickup: "Shop", dropoff: "Customer address" }),
});

const AssignedRepairs = () => <AssignedQueue config={REPAIRS_ASSIGNED_CONFIG} />;

export default memo(AssignedRepairs);