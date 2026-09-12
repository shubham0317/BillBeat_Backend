import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTodaysDeliveries, updateDeliveryStatus } from '../services/deliveryService';

export const deliveryKeys = {
  all: ['deliveries'],
  today: (filters) => [...deliveryKeys.all, 'today', filters],
};

export function useTodaysDeliveries(filters) {
  return useQuery({ queryKey: deliveryKeys.today(filters), queryFn: () => getTodaysDeliveries(filters) });
}

export function useDeliveryMutations() {
  const queryClient = useQueryClient();
  return {
    status: useMutation({ mutationFn: ({ id, status }) => updateDeliveryStatus(id, status), onSuccess: () => queryClient.invalidateQueries({ queryKey: deliveryKeys.all }) }),
  };
}