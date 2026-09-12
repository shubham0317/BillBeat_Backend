import apiClient from './apiClient';

export function getBeats() {
  return apiClient.get('/beats');
}

export function getBeat(id) {
  return apiClient.get(`/beats/${id}`);
}