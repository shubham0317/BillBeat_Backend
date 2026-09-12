import apiClient from './apiClient';

export function getPayments({ billId, customerId }) {
  const params = new URLSearchParams();
  if (billId) params.set('billId', String(billId));
  else if (customerId) params.set('customerId', String(customerId));
  return apiClient.get(`/payments?${params.toString()}`);
}

export function recordPayment(request) {
  return apiClient.post('/payments', request);
}