import { beforeEach, describe, expect, test, vi } from 'vitest';
import apiClient from './services/apiClient';
import { generateBills, getBill, getBills } from './services/billService';

describe('bill service endpoint contracts', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('serializes exact list filters and detail URL', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({});
    await getBills({ customerId: '10', status: 'PARTIALLY_PAID', billingPeriod: '2026-08', page: 2, size: 20 });
    await getBill(50);
    expect(getSpy).toHaveBeenNthCalledWith(1, '/bills?page=2&size=20&customerId=10&status=PARTIALLY_PAID&billingPeriod=2026-08');
    expect(getSpy).toHaveBeenNthCalledWith(2, '/bills/50');
  });

  test('sends exact generation payload with and without customerId', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue([]);
    await generateBills({ billingPeriod: '2026-08' });
    await generateBills({ billingPeriod: '2026-08', customerId: 10 });
    expect(postSpy).toHaveBeenNthCalledWith(1, '/bills/generate', { billingPeriod: '2026-08' });
    expect(postSpy).toHaveBeenNthCalledWith(2, '/bills/generate', { billingPeriod: '2026-08', customerId: 10 });
  });
});