import apiClient from './apiClient';

export function getTodaysDeliveries({ beatId, paperBoyId } = {}) {
  const params = new URLSearchParams();
  if (beatId) params.set('beatId', String(beatId));
  if (paperBoyId) params.set('paperBoyId', String(paperBoyId));
  const query = params.toString();
  return apiClient.get(`/deliveries/today${query ? `?${query}` : ''}`);
}

export function generateTodaysDeliveries() {
  return apiClient.post('/deliveries/generate-today');
}

export function updateDeliveryStatus(id, status) {
  return apiClient.patch(`/deliveries/${id}/status`, { status });
}