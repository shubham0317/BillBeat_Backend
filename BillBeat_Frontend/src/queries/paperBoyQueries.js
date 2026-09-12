import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPaperBoy, getPaperBoy, getPaperBoys, updatePaperBoy } from '../services/paperBoyService';

export const paperBoyKeys = {
  all: ['paper-boys'],
  detail: (id) => ['paper-boys', id],
};

export function usePaperBoys() {
  return useQuery({ queryKey: paperBoyKeys.all, queryFn: getPaperBoys });
}

export function usePaperBoy(id) {
  return useQuery({ queryKey: paperBoyKeys.detail(id), queryFn: () => getPaperBoy(id), enabled: Boolean(id) });
}

export function usePaperBoyMutations() {
  const queryClient = useQueryClient();
  const invalidate = (paperBoy) => {
    if (paperBoy?.id) queryClient.invalidateQueries({ queryKey: paperBoyKeys.detail(paperBoy.id) });
    queryClient.invalidateQueries({ queryKey: paperBoyKeys.all });
  };
  return {
    create: useMutation({ mutationFn: createPaperBoy, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, request }) => updatePaperBoy(id, request), onSuccess: invalidate }),
  };
}
