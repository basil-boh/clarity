import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { fetchDoses, recordDoseProgress } from '@/models/prep/prep.repository';
import type { Dose } from '@/models/prep/prep.types';

/** One glass. The unit the patient actually pours, not a slider. */
export const GLASS_ML = 250;

/**
 * The purge night.
 *
 * The clock ticks here rather than in the screen because it is state, and the
 * screen should be a function of state. One tick every thirty seconds is enough
 * for a display that shows hours and minutes, and costs nothing.
 *
 * Dose progress is written optimistically. At 1am, on a hospital guest network,
 * a patient who taps "one glass" and watches nothing happen will tap again,
 * and the thing this screen exists to measure is exactly how much went down.
 * The cache is corrected on settle either way.
 */
export function usePrepNightController() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const doses = useQuery({ queryKey: ['doses'], queryFn: fetchDoses });

  const record = useMutation({
    mutationFn: ({ doseId, consumedMl }: { doseId: string; consumedMl: number }) =>
      recordDoseProgress(doseId, consumedMl),
    onMutate: async ({ doseId, consumedMl }) => {
      await queryClient.cancelQueries({ queryKey: ['doses'] });
      const previous = queryClient.getQueryData<Dose[]>(['doses']);
      queryClient.setQueryData<Dose[]>(['doses'], (current) =>
        (current ?? []).map((dose) =>
          dose.id === doseId
            ? { ...dose, consumedMl: Math.min(consumedMl, dose.volumeMl) }
            : dose,
),
);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['doses'], context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['doses'] });
      // Dose timing is one of the four signals behind the flag, so the summary
      // is stale the moment a glass is recorded.
      void queryClient.invalidateQueries({ queryKey: ['flag-signals'] });
    },
  });

  function drinkGlass(dose: Dose) {
    record.mutate({
      doseId: dose.id,
      consumedMl: Math.min(dose.consumedMl + GLASS_ML, dose.volumeMl),
    });
  }

  function undoGlass(dose: Dose) {
    record.mutate({
      doseId: dose.id,
      consumedMl: Math.max(dose.consumedMl - GLASS_ML, 0),
    });
  }

  return {
    doses: doses.data ?? [],
    clock: now.toLocaleTimeString('en-SG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
    drinkGlass,
    undoGlass,
  };
}
