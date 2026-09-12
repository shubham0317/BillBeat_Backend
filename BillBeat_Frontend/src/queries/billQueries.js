import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { generateBills, getBill, getBills } from '../services/billService';
import { customerKeys } from './customerQueries';

export const billKeys = {
  all: ['bills'],
  lists: () => [...billKeys.all, 'list'],
  list: (filters) => [...billKeys.lists(), filters],
  details: () => [...billKeys.all, 'detail'],
  detail: (id) => [...billKeys.details(), id],
};

export function useBills(filters) {
  return useQuery({ queryKey: billKeys.list(filters), queryFn: () => getBills(filters), placeholderData: (previous) => previous });
}

export function useBill(id) {
  return useQuery({ queryKey: billKeys.detail(id), queryFn: () => getBill(id), enabled: Boolean(id) });
}

export function useBillMutations() {
  const queryClient = useQueryClient();
  return {
    generate: useMutation({ mutationFn: generateBills, onSuccess: (bills) => { queryClient.invalidateQueries({ queryKey: billKeys.all }); bills?.forEach((bill) => queryClient.invalidateQueries({ queryKey: customerKeys.detail(bill.customerId) })); } }),
  };
}