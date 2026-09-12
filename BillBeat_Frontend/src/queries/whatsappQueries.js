import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billKeys } from './billQueries';
import { getWhatsAppStatus, sendWhatsAppBill } from '../services/whatsappService';

export const whatsappKeys = { all: ['whatsapp'], status: (billId) => [...whatsappKeys.all, 'status', billId] };
export const terminalStatuses = new Set(['DELIVERED', 'READ', 'FAILED']);
export const inFlightStatuses = new Set(['QUEUED', 'SENDING', 'RETRY_PENDING', 'SENT']);

export function useWhatsAppStatus(billId, enabled, polling) {
  return useQuery({
    queryKey: whatsappKeys.status(billId),
    queryFn: () => getWhatsAppStatus(billId),
    enabled: Boolean(billId && enabled),
    refetchInterval: (query) => polling && !terminalStatuses.has(query.state.data?.status) ? 3000 : false,
    refetchIntervalInBackground: false,
    retry: false,
  });
}

export function useWhatsAppMutations() {
  const queryClient = useQueryClient();
  return {
    send: useMutation({ mutationFn: sendWhatsAppBill, onSuccess: (_response, billId) => { queryClient.invalidateQueries({ queryKey: billKeys.detail(billId) }); queryClient.invalidateQueries({ queryKey: whatsappKeys.status(billId) }); } }),
  };
}