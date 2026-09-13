import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

import { scoreMeal, scoreStool } from '@/models/prep/checks.repository';

/**
 * The two photograph checks (features 04 and 07).
 *
 * Both are mutations rather than queries because taking a photograph is an
 * action with a result, not a resource to be cached. `reset` is what "check
 * another" calls: the previous verdict must be cleared rather than left on
 * screen next to a fresh viewfinder.
 *
 * Neither controller ever holds image data. See `checks.repository`.
 */
export function useMealCheckController() {
  const check = useMutation({ mutationFn: scoreMeal });
  return {
    result: check.data ?? null,
    capture: () => check.mutate(),
    reset: () => check.reset(),
    isScoring: check.isPending,
    error: check.error,
  };
}

export function useStoolCheckController() {
  const queryClient = useQueryClient();
  const check = useMutation({
    mutationFn: scoreStool,
    // Bowel output is one of the four signals behind the flag.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['flag-signals'] }),
  });

  return {
    reading: check.data ?? null,
    capture: () => check.mutate(),
    reset: () => check.reset(),
    isScoring: check.isPending,
    error: check.error,
  };
}
