
const API_BASE = "http://localhost:8080";

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getDeliveryProfile(token) {
  const res = await fetch(`${API_BASE}/api/delivery/profile`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function updateDeliveryProfile(token, { name, address, phone }) {
  const res = await fetch(`${API_BASE}/api/delivery/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ name, address, phone }),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}


export async function getAvailableOrders(token) {
  const res = await fetch(`${API_BASE}/api/delivery/orders/available`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to fetch available orders");
  return res.json();
}

export async function getMyDeliveries(token) {
  const res = await fetch(`${API_BASE}/api/delivery/orders/my-deliveries`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to fetch my deliveries");
  return res.json();
}

export async function acceptOrder(token, orderId) {
  const res = await fetch(`${API_BASE}/api/delivery/orders/${orderId}/accept`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to accept order");
  return res.json();
}

export async function rejectOrder(token, orderId) {
  const res = await fetch(`${API_BASE}/api/delivery/orders/${orderId}/reject`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to reject order");
  return res.json();
}

export async function updateOrderStatus(token, orderId, { status, notes }) {
  const res = await fetch(`${API_BASE}/api/delivery/orders/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error("Failed to update order status");
  return res.json();
}

export async function getAvailableRepairs(token) {
  const res = await fetch(`${API_BASE}/api/delivery/repair/available`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to fetch available repairs");
  return res.json();
}

export async function getMyRepairs(token) {
  const res = await fetch(`${API_BASE}/api/delivery/repair/my-deliveries`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to fetch my repairs");
  return res.json();
}

export async function acceptRepair(token, repairId) {
  const res = await fetch(`${API_BASE}/api/delivery/repair/${repairId}/accept`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to accept repair");
  return res.json();
}

export async function rejectRepair(token, repairId) {
  const res = await fetch(`${API_BASE}/api/delivery/repair/${repairId}/reject`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to reject repair");
  return res.json();
}

export async function updateRepairStatus(token, repairId, payload) {
  const res = await fetch(`${API_BASE}/api/delivery/repair/${repairId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update repair status");
  return res.json();
}


export async function getAssignedOrdersNotifications(token) {
  const res = await fetch(`${API_BASE}/api/delivery/orders/my-deliveries`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to get assigned orders");
  return res.json();
}

export async function getAssignedRepairsNotifications(token) {
  const res = await fetch(`${API_BASE}/api/delivery/repair/my-deliveries`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error("Failed to get assigned repairs");
  return res.json();
}