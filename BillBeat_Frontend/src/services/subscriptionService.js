import apiClient from './apiClient';

export function getSubscriptions(customerId) {
  return apiClient.get(customerId ? `/subscriptions?customerId=${encodeURIComponent(customerId)}` : '/subscriptions');
}

export function getSubscription(id) {
  return apiClient.get(`/subscriptions/${id}`);
}

export function createSubscription(request) {
  return apiClient.post('/subscriptions', request);
}

export function updateSubscription(id, request) {
  return apiClient.put(`/subscriptions/${id}`, request);
}

export function updateSubscriptionStatus(id, status) {
  return apiClient.patch(`/subscriptions/${id}/status?status=${encodeURIComponent(status)}`);
}