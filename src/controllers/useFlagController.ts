import { useQuery } from '@tanstack/react-query';

import { computeFlag } from '@/models/flag/flag.rules';
import { fetchFlagSignals } from '@/models/prep/prep.repository';

/** The prep summary. Same derivation as Today, so the two can never disagree. */
export function useFlagController() {
  const signals = useQuery({ queryKey: ['flag-signals'], queryFn: fetchFlagSignals });

  const flag = useQuery({
    queryKey: ['flag', signals.data],
    enabled: Boolean(signals.data),
    queryFn: () => computeFlag(signals.data!),
  });

  return { flag: flag.data, error: signals.error, isLoading: signals.isLoading };
}
