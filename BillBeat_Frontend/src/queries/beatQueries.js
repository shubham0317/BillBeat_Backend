import { useQuery } from '@tanstack/react-query';
import { getBeat, getBeats } from '../services/beatService';

export const beatKeys = {
  all: ['beats'],
  detail: (id) => ['beats', id],
};

export function useBeats() {
  return useQuery({ queryKey: beatKeys.all, queryFn: getBeats });
}

export function useBeat(id) {
  return useQuery({ queryKey: beatKeys.detail(id), queryFn: () => getBeat(id), enabled: Boolean(id) });
}