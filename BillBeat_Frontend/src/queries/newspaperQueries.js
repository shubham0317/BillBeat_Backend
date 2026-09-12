import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createNewspaper, getNewspaper, getNewspapers, updateNewspaper } from '../services/newspaperService';

export const newspaperKeys = {
  all: ['newspapers'],
  detail: (id) => ['newspapers', id],
};

export function useNewspapers() {
  return useQuery({ queryKey: newspaperKeys.all, queryFn: getNewspapers });
}

export function useNewspaper(id) {
  return useQuery({ queryKey: newspaperKeys.detail(id), queryFn: () => getNewspaper(id), enabled: Boolean(id) });
}

export function useNewspaperMutations() {
  const queryClient = useQueryClient();
  const invalidate = (newspaper) => {
    if (newspaper?.id) queryClient.invalidateQueries({ queryKey: newspaperKeys.detail(newspaper.id) });
    queryClient.invalidateQueries({ queryKey: newspaperKeys.all });
  };
  return {
    create: useMutation({ mutationFn: createNewspaper, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, request }) => updateNewspaper(id, request), onSuccess: invalidate }),
  };
}
