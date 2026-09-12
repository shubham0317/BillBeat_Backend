import apiClient from './apiClient';

export function getCustomers({ beatId, billStatus, search, page = 0, size = 20 }) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (beatId) params.set('beatId', String(beatId));
  if (billStatus && billStatus !== 'ALL') params.set('billStatus', billStatus);
  if (search?.trim()) params.set('search', search.trim());
  return apiClient.get(`/customers?${params.toString()}`);
}

export function getCustomer(id) {
  return apiClient.get(`/customers/${id}`);
}

export function createCustomer(request) {
  return apiClient.post('/customers', request);
}

export function updateCustomer(id, request) {
  return apiClient.put(`/customers/${id}`, request);
}

export function patchCustomerStatus(id, changes) {
  const params = new URLSearchParams();
  if (typeof changes.active === 'boolean') params.set('active', String(changes.active));
  if (typeof changes.whatsAppEnabled === 'boolean') params.set('whatsAppEnabled', String(changes.whatsAppEnabled));
  return apiClient.patch(`/customers/${id}?${params.toString()}`);
}