import apiClient from './apiClient';

export function getPaperBoys() {
  return apiClient.get('/paper-boys');
}

export function getPaperBoy(id) {
  return apiClient.get(`/paper-boys/${id}`);
}

export function createPaperBoy(request) {
  return apiClient.post('/paper-boys', request);
}

export function updatePaperBoy(id, request) {
  return apiClient.put(`/paper-boys/${id}`, request);
}
