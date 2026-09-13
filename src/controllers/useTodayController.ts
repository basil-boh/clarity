import { useQuery } from '@tanstack/react-query';

import { computeFlag } from '@/models/flag/flag.rules';
import { fetchFlagSignals, fetchProcedure, fetchProfile } from '@/models/prep/prep.repository';
import { buildPlan, currentDay, offsetFor } from '@/models/prep/prep.schedule';

/**
 * The Today screen.
 *
 * Two things happen here that deliberately do not happen in the screen:
 *
 * - **The plan is derived, not fetched.** `buildPlan` runs against the
 *   procedure date every time, so a rescheduled patient never sees a stale
 *   plan. There is no plan table to migrate.
 * - **The flag colour is computed, not read.** The server stores four signals;
 *   `computeFlag` turns them into a colour on the client. Patient and nurse
 *   therefore cannot be looking at two different rules, and the thresholds can
 *   change without rewriting history.
 */
export function useTodayController() {
  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });
  const procedure = useQuery({ queryKey: ['procedure'], queryFn: fetchProcedure });

  const plan = useQuery({
    queryKey: ['plan', procedure.data?.date],
    enabled: Boolean(procedure.data?.date),
    queryFn: () => {
      const date = procedure.data!.date;
      const offset = offsetFor(date);
      const days = buildPlan(date);
      return { offset, days, today: currentDay(days, offset) };
    },
  });

  const signals = useQuery({ queryKey: ['flag-signals'], queryFn: fetchFlagSignals });

  const flag = useQuery({
    queryKey: ['flag', signals.data],
    enabled: Boolean(signals.data),
    queryFn: () => computeFlag(signals.data!),
  });

  return {
    profile: profile.data,
    procedure: procedure.data,
    plan: plan.data,
    flag: flag.data,
    error: plan.error ?? procedure.error,
    refetch: () => {
      void plan.refetch();
      void procedure.refetch();
    },
  };
}
