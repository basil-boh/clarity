import { differenceInCalendarDays, format, parseISO } from 'date-fns';

import type { Phase, PlanDay, Step } from './prep.types';

/**
 * The prep timeline.
 *
 * The rule the whole app hangs off: **the plan is derived from the procedure
 * date, never stored against it.** A patient who is rescheduled, and they
 * frequently are, must not be left following a plan built for the old date.
 * Nothing here persists a day; `buildPlan` is called with the date and the
 * answer falls out.
 *
 * The window below is the common Singapore public-hospital pattern: three
 * low-residue days, a split-dose purgative the evening before with the second
 * dose in the early hours, clear fluids until the cut-off. It is a *scaffold
 * default*, not clinical guidance: the real plan comes from the department, and
 * `buildPlan` is where that fetch replaces these constants.
 */

/** Low-residue diet starts this many days before the procedure. */
export const DIET_DAYS = 3;

/** The purge begins the evening before. */
export const PURGE_OFFSET = -1;

export function phaseFor(offset: number): Phase {
  if (offset > 0) return 'done';
  if (offset === 0) return 'procedure_day';
  if (offset === PURGE_OFFSET) return 'purge_night';
  if (offset >= -DIET_DAYS) return 'diet_day';
  if (offset >= -7) return 'week_before';
  return 'waiting';
}

/** Days until the procedure. 0 is the morning of; negatives are the run-up. */
export function offsetFor(procedureDate: string, today = new Date()): number {
  return -differenceInCalendarDays(parseISO(procedureDate), today);
}

/**
 * How the app addresses the day.
 *
 * "Tomorrow" and "Tonight" rather than "D-1", because a patient reading this at
 * 11pm has to map it onto their own evening without arithmetic. The `waiting`
 * phase counts in weeks: "in 14 months" is the honest thing to say when the
 * sheet was handed over at the referral.
 */
export function headingFor(offset: number): string {
  switch (offset) {
    case 0:
      return 'Today is the day';
    case -1:
      return 'Tonight is the prep';
    case -2:
      return 'Tomorrow you start the prep';
    default:
      break;
  }
  if (offset > 0) return 'Your procedure has passed';
  const days = Math.abs(offset);
  if (days <= 7) return `${days} days to go`;
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `${weeks} weeks to go`;
  return `${Math.round(days / 30)} months to go`;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function step(id: string,
  kind: Step['kind'],
  title: string,
  at: string | null,
  weight: Step['weight'],
  detail?: string,
): Step {
  return { id, kind, title, at, weight, detail, done: false };
}

/**
 * The steps for one day of the run-up.
 *
 * Split out per phase so the purge night (the only part where timing decides
 * the outcome) is legible on its own rather than buried in a switch that also
 * handles "book your transport".
 */
export function stepsFor(offset: number): Step[] {
  switch (phaseFor(offset)) {
    case 'week_before':
      return [
        step('confirm-meds',
          'medicine',
          'Check which medicines to hold',
          null,
          'advised',
          'Iron tablets and some blood thinners are usually stopped before a scope. The department confirms which, and when.',
),
        step('arrange-escort', 'admin', 'Arrange someone to take you home', null, 'advised'),
        step('collect-prep', 'admin', 'Collect the bowel preparation', null, 'advised'),
      ];

    case 'diet_day':
      return [
        step('low-residue',
          'diet',
          'Low-residue meals only',
          null,
          'advised',
          'No skins, seeds, nuts or wholegrains. Photograph anything you are unsure about.',
),
        step('fluids-day', 'fluid', 'Drink through the day', null, 'advised', 'Aim for 8 glasses.'),
      ];

    case 'purge_night':
      return [
        step('clear-only', 'diet', 'Clear fluids only from now', '12:00', 'critical'),
        step('dose-1',
          'purgative',
          'First dose of the preparation',
          '18:00',
          'critical',
          'Finish the whole volume. Keep drinking clear fluid alongside it.',
),
        step('fluid-after-1', 'fluid', 'Clear fluid after the first dose', '19:00', 'critical'),
        step('dose-2',
          'purgative',
          'Second dose',
          '02:00',
          'critical',
          'The second dose is what clears the right side of the colon. It is the one most often skipped.',
),
      ];

    case 'procedure_day':
      return [
        step('nil-by-mouth', 'diet', 'Nothing by mouth', '06:00', 'critical'),
        step('share-flag', 'admin', 'Show your prep summary at admission', null, 'advised'),
      ];

    case 'waiting':
    case 'done':
    default:
      return [];
  }
}

/**
 * The whole run-up, from a week out to the morning of.
 *
 * Returned as a list rather than a map so the Today screen can render it as a
 * strip in order without re-deriving the sequence.
 */
export function buildPlan(procedureDate: string, today = new Date()): PlanDay[] {
  const procedure = parseISO(procedureDate);

  return Array.from({ length: 8 }, (_, i) => {
    const offset = i - 7;
    const date = new Date(procedure);
    date.setDate(date.getDate() + offset);

    return {
      offset,
      date: format(date, 'yyyy-MM-dd'),
      phase: phaseFor(offset),
      heading: headingFor(offset),
      steps: stepsFor(offset),
    } satisfies PlanDay;
  }).filter((day) => day.steps.length > 0 || day.offset === offsetFor(procedureDate, today));
}

/** The day the patient is on right now, if the run-up has started. */
export function currentDay(plan: readonly PlanDay[], offset: number): PlanDay | undefined {
  return plan.find((day) => day.offset === offset);
}
