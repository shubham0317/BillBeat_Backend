import apiClient from './apiClient';

export function getNewspapers() {
  return apiClient.get('/newspapers');
}

export function getNewspaper(id) {
  return apiClient.get(`/newspapers/${id}`);
}

export function createNewspaper(request) {
  return apiClient.post('/newspapers', request);
}

export function updateNewspaper(id, request) {
  return apiClient.put(`/newspapers/${id}`, request);
}
