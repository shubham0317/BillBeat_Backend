import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerKeys } from './customerQueries';
import { billKeys } from './billQueries';
import { getPayments, recordPayment } from '../services/paymentService';

export const paymentKeys = {
  all: ['payments'],
  list: (filters) => [...paymentKeys.all, filters],
};

export function usePayments(filters) {
  return useQuery({ queryKey: paymentKeys.list(filters), queryFn: () => getPayments(filters), enabled: Boolean(filters.billId || filters.customerId) });
}

export function usePaymentMutations() {
  const queryClient = useQueryClient();
  return {
    record: useMutation({ mutationFn: recordPayment, onSuccess: (payment) => { queryClient.invalidateQueries({ queryKey: billKeys.detail(payment.billId) }); queryClient.invalidateQueries({ queryKey: paymentKeys.all }); queryClient.invalidateQueries({ queryKey: customerKeys.detail(payment.customerId) }); } }),
  };
}