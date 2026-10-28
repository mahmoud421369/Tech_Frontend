// src/common/api/shopReports.js
// All dashboard/report endpoints live here so paths and query format are changed in ONE place.
//
// IMPORTANT (this fixes the date error):
// The backend binds SalesDtoRequest from QUERY PARAMS with ISO dates (yyyy-MM-dd, LocalDate).
// The old page POSTed JSON with "datetime-local" strings (2026-10-28T10:30), which cannot be bound
// to LocalDate -> 400 / binding error. We now send GET + ?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd.
// Both empty => backend uses "today".
import api from "./api";

const BASE = "/api/shops/dashboard";

export const ENDPOINTS = {
  overview: `${BASE}/overview`,        // -> DashboardOverviewDto
  performance: `${BASE}/performance`,  // -> PerformanceReportDto
  salesToday: `${BASE}/sales/stats`,   // -> { todaySales }
  repairsToday: `${BASE}/repairs/stats`, // -> { todayRepairs }
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

// Only well-formed ISO days ever reach the server.
const toParams = ({ startDate, endDate } = {}) => {
  const p = {};
  if (ISO_DAY.test(startDate || "")) p.startDate = startDate;
  if (ISO_DAY.test(endDate || "")) p.endDate = endDate;
  return p;
};

export const fetchOverview = (range, signal) =>
  api.get(ENDPOINTS.overview, { params: toParams(range), signal }).then((r) => r.data);

export const fetchPerformance = (range, signal) =>
  api.get(ENDPOINTS.performance, { params: toParams(range), signal }).then((r) => r.data);

// "Today" cards: tolerate partial failure so one broken endpoint doesn't blank the rest.
export const fetchToday = async (_range, signal) => {
  const [s, r] = await Promise.allSettled([
    api.get(ENDPOINTS.salesToday, { signal }),
    api.get(ENDPOINTS.repairsToday, { signal }),
  ]);
  if (signal?.aborted) throw new DOMException("aborted", "AbortError");
  return {
    todaySales: s.status === "fulfilled" ? Number(s.value.data?.todaySales) || 0 : 0,
    todayRepairs: r.status === "fulfilled" ? Number(r.value.data?.todayRepairs) || 0 : 0,
    ok: s.status === "fulfilled" && r.status === "fulfilled",
  };
};