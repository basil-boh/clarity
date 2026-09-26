import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns'

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

/**
 * Where to be, when, and who to call.
 *
 * All of it used to come from the department. In this app the patient enters
 * their own date, and there is no one to supply the rest -- so the hospital,
 * the location and the department's number are routinely blank, and every
 * screen that shows them has to cope with that rather than render an empty
 * line or a `tel:` link that dials nothing. See `hasDepartmentPhone`.
 */
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
  /**
   * The clock has passed midnight: this time falls on the day *after* the one
   * the step is listed under.
   *
   * The second dose is at 2am. To the patient that is still "tonight" -- they
   * are awake, mid-prep, and the app says "Tonight is the prep" -- so it is
   * listed under the purge night and must stay there. But the calendar date has
   * already rolled over, and anything that turns a step into a real instant
   * (the .ics export, any reminder) has to know that. Without this the 2am dose
   * was stamped 24 hours early: the alarm fired the night *before* the prep
   * began and never fired for the dose itself.
   */
  readonly nextDay?: boolean
}

/**
 * A spec placed on a day.
 *
 * `uid` exists because the same spec legitimately recurs -- you eat low-residue
 * on each of the three diet days -- and completion is per occurrence. Keying
 * progress off `id` alone meant ticking Monday's meal struck through Tuesday's
 * and inflated the denominator with repeats.
 */
export type Step = StepSpec & {
  readonly uid: string
  /**
   * The calendar date this step's clock time actually falls on, `yyyy-MM-dd`.
   *
   * Usually the date of the day it is listed under, but not for a `nextDay`
   * step. Anything building a real instant reads this, never the day's date.
   */
  readonly date: string
}

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

/**
 * Whether there is a number to call.
 *
 * "Call the department" is the escape hatch every screen offers when the app
 * cannot answer something, and it is the one link a worried patient at 1am will
 * press. An `href="tel:"` with nothing after it looks identical and does
 * nothing, which is worse than not offering it -- so where this is false, the
 * offer is withheld rather than shown broken.
 */
export function hasDepartmentPhone(procedure: Procedure): boolean {
  return procedure.departmentPhone.trim().length > 0
}

export function phaseFor(offset: number): Phase {
  if (offset > 0) return 'done'
  if (offset === 0) return 'procedure_day'
  if (offset === PURGE_OFFSET) return 'purge_night'
  if (offset >= -DIET_DAYS) return 'diet_day'
  if (offset >= -7) return 'week_before'
  return 'waiting'
}

/**
 * The department's calendar.
 *
 * "Today" is a Singapore date wherever the server runs. Reading it off the
 * server's own clock was right on a laptop in Singapore and wrong on any host
 * that runs on UTC -- Vercel among them -- which is eight hours behind: from
 * midnight to 8am the whole plan sat a day late, and procedure morning read as
 * "Tonight is the prep".
 */
export const TIME_ZONE = 'Asia/Singapore'

const WALL_CLOCK = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

/**
 * What a clock in Singapore reads at `instant`, as a local `Date` -- for
 * date-fns to format or count from. Not an instant itself: never send it
 * anywhere or compare it with a real one.
 */
export function inSingapore(instant: Date): Date {
  const part = Object.fromEntries(
    WALL_CLOCK.formatToParts(instant).map((p) => [p.type, Number(p.value)]),
  )
  return new Date(part.year, part.month - 1, part.day, part.hour % 24, part.minute, part.second)
}

/** Today in Singapore, `yyyy-MM-dd`. */
export function todayIn(now = new Date()): string {
  return format(inSingapore(now), 'yyyy-MM-dd')
}

/** The Singapore date `days` from today, `yyyy-MM-dd`. */
export function dateFromToday(days: number, now = new Date()): string {
  return format(addDays(parseISO(todayIn(now)), days), 'yyyy-MM-dd')
}

/** Days until the procedure. 0 is the morning of; negatives are the run-up. */
export function offsetFor(procedureDate: string, now = new Date()): number {
  // Counted from the procedure to today rather than negated, which gave -0 on
  // the day itself.
  return differenceInCalendarDays(parseISO(todayIn(now)), parseISO(procedureDate))
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
    blurb: 'Low-residue meals only. Clarify dishes you are unsure about in the Ask tab.',
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
  nextDay = false,
): StepSpec {
  return { id, kind, title, at, weight, detail, nextDay }
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
          'Iron tablets and some blood thinners are usually stopped before a scope. The hospital/clinic confirms which, and when.',
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
        // 2am, which is the following calendar date -- see `nextDay`.
        step(
          'dose-2',
          'purgative',
          'Second dose',
          '02:00',
          'critical',
          'The second dose of purgative is what clears the right side of the colon. It is the one most often skipped.',
          true,
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
export function buildPlan(procedureDate: string, now = new Date()): PlanDay[] {
  const procedure = parseISO(procedureDate)
  const here = offsetFor(procedureDate, now)

  return Array.from({ length: 8 }, (_, i) => {
    const offset = i - 7
    const date = new Date(procedure)
    date.setDate(date.getDate() + offset)
    const iso = format(date, 'yyyy-MM-dd')
    return {
      offset,
      date: iso,
      phase: phaseFor(offset),
      heading: headingFor(offset),
      steps: stepsFor(offset).map((spec) => ({
        ...spec,
        uid: `${offset}:${spec.id}`,
        // `uid` stays keyed to the day the step is listed under, so a tick
        // recorded against the purge night is still a tick against it.
        date: spec.nextDay ? format(addDays(date, 1), 'yyyy-MM-dd') : iso,
      })),
    } satisfies PlanDay
  }).filter((day) => day.steps.length > 0 || day.offset === here)
}

export function currentDay(plan: readonly PlanDay[], offset: number): PlanDay | undefined {
  return plan.find((day) => day.offset === offset)
}

/**
 * How long an after-midnight step stays on screen once its time has come. The
 * second dose takes an hour or two to drink; hiding it at 02:01 would drop it
 * from view while the patient is still working through it.
 */
const CARRY_OVER_HOURS = 3

/** The real instant a timed step happens, read as Singapore wall-clock time. */
function stepInstant(step: Step & { at: string }): Date {
  return new Date(`${step.date}T${step.at}:00+08:00`)
}

/**
 * The plan from today on, with the days already done removed.
 *
 * A patient only needs what is coming, not a record of what has passed. The
 * one exception is a step listed under yesterday whose clock time falls today:
 * at 01:30 on procedure day the 2am second dose is still ahead, and dropping
 * the purge night at midnight would hide the dose most often skipped. Such a
 * step is kept, under its own day, until a few hours after its time.
 */
export function upcomingPlan(plan: readonly PlanDay[], now = new Date()): PlanDay[] {
  const today = todayIn(now)
  const cutoff = now.getTime() - CARRY_OVER_HOURS * 60 * 60 * 1000
  return plan.flatMap((day) => {
    if (day.date >= today) return [day]
    const carried = day.steps.filter(
      (step) => step.date >= today && step.at !== null && stepInstant(step as Step & { at: string }).getTime() > cutoff,
    )
    return carried.length > 0 ? [{ ...day, steps: carried }] : []
  })
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
