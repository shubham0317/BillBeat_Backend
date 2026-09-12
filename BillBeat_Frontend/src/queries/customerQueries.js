import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCustomer, getCustomer, getCustomers, patchCustomerStatus, updateCustomer } from '../services/customerService';

export const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (filters) => [...customerKeys.lists(), filters],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
};

export function useCustomers(filters) {
  return useQuery({ queryKey: customerKeys.list(filters), queryFn: () => getCustomers(filters), placeholderData: (previous) => previous });
}

export function useCustomer(id) {
  return useQuery({ queryKey: customerKeys.detail(id), queryFn: async () => (await getCustomer(id)) ?? null, enabled: Boolean(id) });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const invalidate = (customer) => {
    if (customer?.id) queryClient.invalidateQueries({ queryKey: customerKeys.detail(customer.id) });
    queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
  };
  return {
    create: useMutation({ mutationFn: createCustomer, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, request }) => updateCustomer(id, request), onSuccess: invalidate }),
    patchStatus: useMutation({ mutationFn: ({ id, changes }) => patchCustomerStatus(id, changes), onSuccess: invalidate }),
  };
}