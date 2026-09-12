import { beforeEach, describe, expect, test, vi } from 'vitest';
import apiClient from './services/apiClient';
import { generateTodaysDeliveries, getTodaysDeliveries, updateDeliveryStatus } from './services/deliveryService';

describe('delivery service endpoint contracts', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('serializes today filters exactly', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue([]);
    await getTodaysDeliveries();
    await getTodaysDeliveries({ beatId: 1, paperBoyId: 3 });
    expect(getSpy).toHaveBeenNthCalledWith(1, '/deliveries/today');
    expect(getSpy).toHaveBeenNthCalledWith(2, '/deliveries/today?beatId=1&paperBoyId=3');
  });

  test('uses exact generation and status update contracts', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue([]);
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({});
    await generateTodaysDeliveries();
    await updateDeliveryStatus(100, 'NOT_DELIVERED');
    expect(postSpy).toHaveBeenCalledWith('/deliveries/generate-today');
    expect(patchSpy).toHaveBeenCalledWith('/deliveries/100/status', { status: 'NOT_DELIVERED' });
  });
});