import { useQuery } from '@tanstack/react-query';
import api from '../api/api';

const KEYS = { order: 'pendingPayment', repair: 'pendingRepairPayment' };
const MAX_AGE = 24 * 60 * 60 * 1000;

const PAID = ['PAID', 'COMPLETED', 'SUCCESS', 'SUCCEEDED'];
const FAILED = ['FAILED', 'DECLINED', 'CANCELLED', 'CANCELED', 'VOIDED', 'EXPIRED', 'REFUNDED'];

export const ORDER_URL = (id) => `/api/users/orders/${encodeURIComponent(id)}`;
export const REPAIR_URL = (id) => `/api/users/repair-request/${encodeURIComponent(id)}`;

export const getPaymentState = (d) => {
  if (!d) return 'pending';
  if (d.paid === true || d.isPaid === true) return 'paid';
  const s = String(d.paymentStatus ?? d.payment?.status ?? d.status ?? '').toUpperCase();
  if (PAID.includes(s)) return 'paid';
  if (FAILED.includes(s)) return 'failed';
  return 'pending';
};

export const savePending = (p, kind = 'order') => {
  try {
    localStorage.setItem(KEYS[kind], JSON.stringify({ orderId: p.orderId, url: p.url ?? null, ts: Date.now() }));
  } catch {  }
};

export const clearPending = (kind = 'order') => {
  try { localStorage.removeItem(KEYS[kind]); } catch {  }
};

export const loadPending = (kind = 'order') => {
  try {
    const p = JSON.parse(localStorage.getItem(KEYS[kind]) || 'null');
    if (!p?.orderId || Date.now() - p.ts > MAX_AGE) { clearPending(kind); return null; }
    return { orderId: p.orderId, url: p.url ?? null };
  } catch { return null; }
};

const usePaymentPoll = (scope, buildUrl, id, token, enabled) => useQuery({
  queryKey: [scope, id],
  queryFn: async ({ signal }) => (await api.get(buildUrl(id), { signal, headers: { Authorization: `Bearer ${token}` } })).data,
  select: getPaymentState,
  enabled: !!id && !!token && enabled,
  refetchInterval: (q) => (getPaymentState(q.state.data) === 'pending' ? 5000 : false),
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: 'always',
  staleTime: 0,
  gcTime: 0,
  retry: (count, err) => count < 2 && ![400, 401, 403, 404].includes(err?.response?.status),
});

export const useOrderPayment = (orderId, token, enabled = true) => usePaymentPoll('orderPayment', ORDER_URL, orderId, token, enabled);
export const useRepairPayment = (repairId, token, enabled = true) => usePaymentPoll('repairPayment', REPAIR_URL, repairId, token, enabled);