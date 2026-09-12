import apiClient from './apiClient';

export function getBills({ customerId, status, billingPeriod, page = 0, size = 20 }) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (customerId) params.set('customerId', String(customerId));
  if (status && status !== 'ALL') params.set('status', status);
  if (billingPeriod) params.set('billingPeriod', billingPeriod);
  return apiClient.get(`/bills?${params.toString()}`);
}

export function getBill(id) {
  return apiClient.get(`/bills/${id}`);
}

export function generateBills(request) {
  return apiClient.post('/bills/generate', request);
}