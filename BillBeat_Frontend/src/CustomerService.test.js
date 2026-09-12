import { beforeEach, describe, expect, test, vi } from 'vitest';
import apiClient from './services/apiClient';
import { getCustomer, getCustomers, patchCustomerStatus } from './services/customerService';

describe('customer service endpoint contracts', () => {
  beforeEach(() => vi.restoreAllMocks());

  test('uses exact list, detail, and PATCH paths', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({});
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({});
    await getCustomers({ beatId: '1', billStatus: 'DUE', search: 'Rahul', page: 2, size: 20 });
    await getCustomer(10);
    await patchCustomerStatus(10, { whatsAppEnabled: false });
    expect(getSpy).toHaveBeenNthCalledWith(1, '/customers?page=2&size=20&beatId=1&billStatus=DUE&search=Rahul');
    expect(getSpy).toHaveBeenNthCalledWith(2, '/customers/10');
    expect(patchSpy).toHaveBeenCalledWith('/customers/10?whatsAppEnabled=false');
  });

  test('can send active and WhatsApp changes together with exact casing', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({});
    await patchCustomerStatus(10, { active: false, whatsAppEnabled: true });
    expect(patchSpy).toHaveBeenCalledWith('/customers/10?active=false&whatsAppEnabled=true');
  });
});