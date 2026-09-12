import { beforeEach, describe, expect, test, vi } from 'vitest';
import apiClient from './services/apiClient';
import { getPayments, recordPayment } from './services/paymentService';

describe('payment service endpoint contracts', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('sends exact POST payload and preserves optional fields', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({});
    await recordPayment({ billId: 50, amount: 200, paymentMethod: 'UPI' });
    await recordPayment({ billId: 50, amount: 200, paymentMethod: 'BANK_TRANSFER', transactionRef: 'REF-1', notes: 'Paid at office' });
    expect(postSpy).toHaveBeenNthCalledWith(1, '/payments', { billId: 50, amount: 200, paymentMethod: 'UPI' });
    expect(postSpy).toHaveBeenNthCalledWith(2, '/payments', { billId: 50, amount: 200, paymentMethod: 'BANK_TRANSFER', transactionRef: 'REF-1', notes: 'Paid at office' });
  });

  test('uses exact billId and customerId payment history filters', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue([]);
    await getPayments({ billId: 50 });
    await getPayments({ customerId: 10 });
    expect(getSpy).toHaveBeenNthCalledWith(1, '/payments?billId=50');
    expect(getSpy).toHaveBeenNthCalledWith(2, '/payments?customerId=10');
  });
});