import { beforeEach, describe, expect, test, vi } from 'vitest';
import apiClient from './services/apiClient';
import { getWhatsAppStatus, sendWhatsAppBill } from './services/whatsappService';

describe('WhatsApp service endpoint contracts', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('uses exact status endpoint', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({});
    await getWhatsAppStatus(50);
    expect(getSpy).toHaveBeenCalledWith('/bills/50/whatsapp-status');
  });

  test('sends without a request body', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({ status: 'SENT' });
    await sendWhatsAppBill(50);
    expect(postSpy).toHaveBeenCalledWith('/bills/50/send-whatsapp');
  });
});