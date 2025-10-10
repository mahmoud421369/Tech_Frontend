import api from '../api';

export async function getDeliveryProfile() {
  try {
    const response = await api.get('/api/delivery/profile');
    return response.data;
  } catch (error) {
    throw new Error("Failed to load profile");
  }
}

export async function updateDeliveryProfile(data) {
  try {
    const response = await api.put('/api/delivery/profile', data);
    return response.data;
  } catch (error) {
    throw new Error("Failed to update profile");
  }
}

export async function getAvailableOrders() {
  try {
    const response = await api.get('/api/delivery/orders/available');
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch available orders");
  }
}

export async function getMyDeliveries() {
  try {
    const response = await api.get('/api/delivery/orders/my-deliveries');
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch my deliveries");
  }
}

export async function acceptOrder(orderId) {
  try {
    const response = await api.post(`/api/delivery/orders/${orderId}/accept`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to accept order");
  }
}

export async function rejectOrder(orderId) {
  try {
    const response = await api.post(`/api/delivery/orders/${orderId}/reject`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to reject order");
  }
}

export async function updateOrderStatus(orderId, data) {
  try {
    const response = await api.put(`/api/delivery/orders/${orderId}/status`, data);
    return response.data;
  } catch (error) {
    throw new Error("Failed to update order status");
  }
}

export async function getAvailableRepairs() {
  try {
    const response = await api.get('/api/delivery/repair/available');
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch available repairs");
  }
}

export async function getMyRepairs() {
  try {
    const response = await api.get('/api/delivery/repair/my-deliveries');
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch my repairs");
  }
}

export async function acceptRepair(repairId) {
  try {
    const response = await api.post(`/api/delivery/repair/${repairId}/accept`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to accept repair");
  }
}

export async function rejectRepair(repairId) {
  try {
    const response = await api.post(`/api/delivery/repair/${repairId}/reject`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to reject repair");
  }
}



export async function updateRepairStatus(repairRequestId, payload) {
  try {
    const response = await api.put(`/api/delivery/repair/${repairRequestId}/status`, payload);
    return response.data;
  } catch (error) {
    throw new Error("Failed to update repair status");
  }
}

export async function getAssignedOrdersNotifications() {
  try {
    const response = await api.get('/api/delivery/orders/my-deliveries');
    return response.data;
  } catch (error) {
    throw new Error("Failed to get assigned orders");
  }
}

export async function getAssignedRepairsNotifications() {
  try {
    const response = await api.get('/api/delivery/repair/my-deliveries');
    return response.data;
  } catch (error) {
    throw new Error("Failed to get assigned repairs");
  }
}