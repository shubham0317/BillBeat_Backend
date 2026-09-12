import { beforeEach, describe, expect, test, vi } from 'vitest';
import apiClient from './services/apiClient';
import { createSubscription, getSubscription, getSubscriptions, updateSubscription, updateSubscriptionStatus } from './services/subscriptionService';

describe('subscription service endpoint contracts', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('serializes list, detail, create, and update requests exactly', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({});
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue({});
    const request = { customerId: 10, newspaperId: 2, copies: 2, pricePerCopy: 6.5, startDate: '2026-09-01', endDate: null, deliverySchedule: { monday: true, tuesday: false, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false } };
    await getSubscriptions();
    await getSubscriptions(10);
    await getSubscription(20);
    await createSubscription(request);
    await updateSubscription(20, request);
    expect(getSpy).toHaveBeenNthCalledWith(1, '/subscriptions');
    expect(getSpy).toHaveBeenNthCalledWith(2, '/subscriptions?customerId=10');
    expect(getSpy).toHaveBeenNthCalledWith(3, '/subscriptions/20');
    expect(postSpy).toHaveBeenCalledWith('/subscriptions', request);
    expect(putSpy).toHaveBeenCalledWith('/subscriptions/20', request);
  });

  test('uses exact status PATCH query contract', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({});
    await updateSubscriptionStatus(20, 'PAUSED');
    expect(patchSpy).toHaveBeenCalledWith('/subscriptions/20/status?status=PAUSED');
  });
});