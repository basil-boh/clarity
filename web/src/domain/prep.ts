import { differenceInCalendarDays, format, parseISO } from 'date-fns'

/**
 * The domain, in one file.
 *
 * Ported from the Expo app, and the shape comes from the same CW12 finding:
 * *diet is the experience, the purgative is the outcome*. Clinicians were
 * unanimous that finishing the full volume at the right time is what decides
 * whether the bowel is clean; the three diet days decide whether the patient is
 * willing to come back in two years. Different problems, so different types,
 * and the app never averages one into the other.
 */

// ---------------------------------------------------------------------------
// The patient
// ---------------------------------------------------------------------------

export type Language = 'en' | 'zh' | 'ms' | 'ta'
export type Reader = 'patient' | 'caregiver'

export type Profile = {
  readonly displayName: string
  readonly language: Language
  readonly reader: Reader
}

/** Where to be, when, and who to call. All of it comes from the department. */
export type Procedure = {
  /** ISO date, `yyyy-MM-dd`. The whole plan is derived from this one value. */
  readonly date: string
  readonly hospital: string
  readonly location: string
  /** Local wall-clock time, `HH:mm`. */
  readonly arriveAt: string
  readonly departmentPhone: string
}

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/**
 * Where the patient is in the run-up, as a named phase rather than a date
 * arithmetic result scattered across screens.
 *
 * `waiting` can last two years -- the sheet is handed over at the referral and
 * never revisited -- which is exactly the stretch a leaflet cannot survive and
 * a web app can.
 */
export type Phase =
  | 'waiting'
  | 'week_before'
  | 'diet_day'
  | 'purge_night'
  | 'procedure_day'
  | 'done'

export type StepKind = 'diet' | 'fluid' | 'medicine' | 'purgative' | 'admin'

export type StepSpec = {
  readonly id: string
  readonly kind: StepKind
  readonly title: string
  readonly detail?: string
  /** Local wall-clock time, `HH:mm`. Null for "some time today". */
  readonly at: string | null
  /**
   * Whether missing this changes the outcome. Only purgative timing and volume
   * are `critical`; everything else is `advised`.
   */
  readonly weight: 'critical' | 'advised'
}

/**
 * A spec placed on a day.
 *
 * `uid` exists because the same spec legitimately recurs -- you eat low-residue
 * on each of the three diet days -- and completion is per occurrence. Keying
 * progress off `id` alone meant ticking Monday's meal struck through Tuesday's
 * and inflated the denominator with repeats.
 */
export type Step = StepSpec & { readonly uid: string }

export type PlanDay = {
  /** Days until the procedure. 0 is the morning of; negatives are the run-up. */
  readonly offset: number
  readonly date: string
  readonly phase: Phase
  readonly heading: string
  readonly steps: readonly Step[]
}

/** Low-residue diet starts this many days before the procedure. */
export const DIET_DAYS = 3
/** The purge begins the evening before. */
export const PURGE_OFFSET = -1

export function phaseFor(offset: number): Phase {
  if (offset > 0) return 'done'
  if (offset === 0) return 'procedure_day'
  if (offset === PURGE_OFFSET) return 'purge_night'
  if (offset >= -DIET_DAYS) return 'diet_day'
  if (offset >= -7) return 'week_before'
  return 'waiting'
}

/** Days until the procedure. 0 is the morning of; negatives are the run-up. */
export function offsetFor(procedureDate: string, today = new Date()): number {
  return -differenceInCalendarDays(parseISO(procedureDate), today)
}

/**
 * How the app addresses the day.
 *
 * "Tonight" rather than "D-1", because a patient reading this at 11pm has to
 * map it onto their own evening without arithmetic.
 */
export function headingFor(offset: number): string {
  switch (offset) {
    case 0:
      return 'Today is the day'
    case -1:
      return 'Tonight is the prep'
    case -2:
      return 'Tomorrow you start the prep'
    default:
      break
  }
  if (offset > 0) return 'Your procedure has passed'
  const days = Math.abs(offset)
  if (days <= 7) return `${days} days to go`
  const weeks = Math.round(days / 7)
  if (weeks < 9) return `${weeks} weeks to go`
  return `${Math.round(days / 30)} months to go`
}

/** How the phase is named to the patient, and what it is for. */
export const PHASE_COPY: Readonly<Record<Phase, { name: string; blurb: string }>> = {
  waiting: {
    name: 'Waiting',
    blurb:
      'Nothing to do yet. We will tell you when to start, so you can put the sheet away.',
  },
  week_before: {
    name: 'The week before',
    blurb: 'Arrange your escort, check your medicines, collect the preparation.',
  },
  diet_day: {
    name: 'Diet days',
    blurb: 'Low-residue meals only. Photograph anything you are unsure about.',
  },
  purge_night: {
    name: 'The purge night',
    blurb: 'Finish the full volume, at the times given. This is what decides the outcome.',
  },
  procedure_day: {
    name: 'Procedure day',
    blurb: 'Nothing by mouth. Bring your prep summary to admission.',
  },
  done: {
    name: 'Afterwards',
    blurb: 'Your procedure has passed. Your next one will appear here when it is booked.',
  },
}

/** The run-up in order, for the journey strip. */
export const PHASE_ORDER: readonly Phase[] = [
  'waiting',
  'week_before',
  'diet_day',
  'purge_night',
  'procedure_day',
]

function step(
  id: string,
  kind: StepKind,
  title: string,
  at: string | null,
  weight: StepSpec['weight'],
  detail?: string,
): StepSpec {
  return { id, kind, title, at, weight, detail }
}

/**
 * The steps for one day of the run-up.
 *
 * Split per phase so the purge night -- the only part where timing decides the
 * outcome -- is legible on its own rather than buried in a switch that also
 * handles "book your transport".
 */
function stepsFor(offset: number): StepSpec[] {
  switch (phaseFor(offset)) {
    case 'week_before':
      // One-off errands. Repeating "arrange an escort" on four consecutive days
      // is noise, and it inflated the progress denominator.
      if (offset !== -7) return []
      return [
        step(
          'confirm-meds',
          'medicine',
          'Check which medicines to hold',
          null,
          'advised',
          'Iron tablets and some blood thinners are usually stopped before a scope. The department confirms which, and when.',
        ),
        step('arrange-escort', 'admin', 'Arrange someone to take you home', null, 'advised'),
        step('collect-prep', 'admin', 'Collect the bowel preparation', null, 'advised'),
      ]

    case 'diet_day':
      return [
        step(
          'low-residue',
          'diet',
          'Low-residue meals only',
          null,
          'advised',
          'No skins, seeds, nuts or wholegrains.',
        ),
        step('fluids-day', 'fluid', 'Drink through the day', null, 'advised', 'Aim for 8 glasses.'),
      ]

    case 'purge_night':
      return [
        step('clear-only', 'diet', 'Clear fluids only from now', '12:00', 'critical'),
        step(
          'dose-1',
          'purgative',
          'First dose of the preparation',
          '18:00',
          'critical',
          'Finish the whole volume. Keep drinking clear fluid alongside it.',
        ),
        step('fluid-after-1', 'fluid', 'Clear fluid after the first dose', '19:00', 'critical'),
        step(
          'dose-2',
          'purgative',
          'Second dose',
          '02:00',
          'critical',
          'The second dose is what clears the right side of the colon. It is the one most often skipped.',
        ),
      ]

    case 'procedure_day':
      return [
        step('nil-by-mouth', 'diet', 'Nothing by mouth', '06:00', 'critical'),
        step('share-flag', 'admin', 'Show your prep summary at admission', null, 'advised'),
      ]

    default:
      return []
  }
}

/**
 * The whole run-up, from a week out to the morning of.
 *
 * The rule the app hangs off: **the plan is derived from the procedure date,
 * never stored against it.** A patient who is rescheduled -- and they
 * frequently are -- must not be left following a plan built for the old date.
 */
export function buildPlan(procedureDate: string, today = new Date()): PlanDay[] {
  const procedure = parseISO(procedureDate)
  const here = offsetFor(procedureDate, today)

  return Array.from({ length: 8 }, (_, i) => {
    const offset = i - 7
    const date = new Date(procedure)
    date.setDate(date.getDate() + offset)
    return {
      offset,
      date: format(date, 'yyyy-MM-dd'),
      phase: phaseFor(offset),
      heading: headingFor(offset),
      steps: stepsFor(offset).map((spec) => ({ ...spec, uid: `${offset}:${spec.id}` })),
    } satisfies PlanDay
  }).filter((day) => day.steps.length > 0 || day.offset === here)
}

export function currentDay(plan: readonly PlanDay[], offset: number): PlanDay | undefined {
  return plan.find((day) => day.offset === offset)
}

// ---------------------------------------------------------------------------
// The purgative (the part that decides the outcome)
// ---------------------------------------------------------------------------

/**
 * One dose of the bowel preparation.
 *
 * `volumeMl` is stated, tracked and shown because "finish the full volume" was
 * the single thing every clinician in the CW12 interviews agreed on, and on the
 * paper sheet it gets one line.
 */
export type Dose = {
  readonly id: string
  readonly label: string
  /** Local wall-clock time, `HH:mm`. */
  readonly at: string
  readonly volumeMl: number
  readonly note: string
}

/**
 * One glass: the unit the patient actually pours.
 *
 * Not a slider. At 1am, tired, the question a patient can answer is "how many
 * glasses have I got through", not "what percentage of 1000ml".
 */
export const GLASS_ML = 250

/**
 * The split dose, the evening before.
 *
 * Volumes and times are the common Singapore public-hospital pattern and are a
 * scaffold default, not clinical guidance -- the real regime comes from the
 * department, and this is where that fetch replaces these constants.
 */
export function dosesFor(): Dose[] {
  return [
    {
      id: 'dose-1',
      label: 'First dose',
      at: '18:00',
      volumeMl: 1000,
      note: 'Finish the whole volume. Keep drinking clear fluid alongside it.',
    },
    {
      id: 'dose-2',
      label: 'Second dose',
      at: '02:00',
      volumeMl: 1000,
      note: 'This is the one that clears the right side of the colon, and the one most often skipped.',
    },
  ]
}

/** Total prescribed volume across the night. */
export function totalDoseMl(): number {
  return dosesFor().reduce((sum, d) => sum + d.volumeMl, 0)
}
