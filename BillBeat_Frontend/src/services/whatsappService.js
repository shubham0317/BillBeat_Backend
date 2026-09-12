import apiClient from './apiClient';

export function getWhatsAppStatus(billId) {
  return apiClient.get(`/bills/${billId}/whatsapp-status`);
}

export function sendWhatsAppBill(billId) {
  return apiClient.post(`/bills/${billId}/send-whatsapp`);
}