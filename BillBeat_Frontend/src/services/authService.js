import apiClient from './apiClient';

export function login(request) {
  return apiClient.post('/auth/login', request);
}

export function registerVendor(request) {
  return apiClient.post('/auth/register-vendor', request);
}

export function getCurrentUser() {
  return apiClient.get('/auth/me');
}