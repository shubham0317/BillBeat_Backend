import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSubscription, getSubscription, getSubscriptions, updateSubscription, updateSubscriptionStatus } from '../services/subscriptionService';
import { customerKeys } from './customerQueries';

export const subscriptionKeys = {
  all: ['subscriptions'],
  lists: () => [...subscriptionKeys.all, 'list'],
  list: (customerId) => [...subscriptionKeys.lists(), { customerId: customerId || null }],
  details: () => [...subscriptionKeys.all, 'detail'],
  detail: (id) => [...subscriptionKeys.details(), id],
};

export function useSubscriptions(customerId) {
  return useQuery({ queryKey: subscriptionKeys.list(customerId), queryFn: () => getSubscriptions(customerId) });
}

export function useSubscription(id) {
  return useQuery({ queryKey: subscriptionKeys.detail(id), queryFn: () => getSubscription(id), enabled: Boolean(id) });
}

export function useSubscriptionMutations() {
  const queryClient = useQueryClient();
  const invalidate = (subscription) => {
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
    if (subscription?.customerId) queryClient.invalidateQueries({ queryKey: customerKeys.detail(subscription.customerId) });
  };
  return {
    create: useMutation({ mutationFn: createSubscription, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, request }) => updateSubscription(id, request), onSuccess: invalidate }),
    status: useMutation({ mutationFn: ({ id, status }) => updateSubscriptionStatus(id, status), onSuccess: invalidate }),
  };
}