import type { PlanDay, Step } from './prep.ts'

/**
 * Which messages to send, and when.
 *
 * The calendar export already puts alarms on a patient's phone, but only for a
 * patient who tapped "Add to calendar" -- and the people least likely to do
 * that are the people most likely to need waking at 2am. This is the half that
 * needs nothing from them.
 *
 * Everything here is pure. The scheduler, the database and the Telegram API all
 * live elsewhere, so the question "should this patient be messaged right now"
 * can be answered in a test rather than at one in the morning.
 */

/** How long before a dose to send. Long enough to find the jug and start. */
export const LEAD_MINUTES = 30

/**
 * Singapore is UTC+8 and has observed no daylight saving since 1982, so the
 * offset is written in rather than computed. `prep.ts` reads the zone the other
 * way round -- an instant to a wall clock -- and this is the inverse: a wall
 * clock the patient was given, back to the instant it actually falls on.
 */
const SINGAPORE_OFFSET = '+08:00'

export function stepInstant(step: { date: string; at: string }): Date {
  return new Date(`${step.date}T${step.at}:00${SINGAPORE_OFFSET}`)
}

/** A step with a clock time, which is the only kind that can be reminded about. */
export type TimedStep = Step & { readonly at: string }

/**
 * The steps worth interrupting someone for.
 *
 * Only the purgative. Every clinician in the CW12 interviews agreed that
 * finishing the full volume on time is what decides the outcome, and a reminder
 * that also fires for "arrange your escort" trains a patient to ignore the one
 * that matters. `at` is required: a step with no time cannot be reminded about.
 */
export function remindableSteps(plan: readonly PlanDay[]): TimedStep[] {
  return plan
    .flatMap((day) => day.steps)
    .filter((step): step is TimedStep => step.kind === 'purgative' && step.at !== null)
    .sort((a, b) => stepInstant(a).getTime() - stepInstant(b).getTime())
}

export type DueReminder = {
  readonly step: TimedStep
  /** `yyyy-MM-dd:step-id`, the key the send log is written against. */
  readonly key: string
  readonly dueAt: Date
  readonly happensAt: Date
}

export function reminderKey(step: { date: string; id: string }): string {
  return `${step.date}:${step.id}`
}

/**
 * What to send this patient right now.
 *
 * The window is deliberately wide: a reminder is due from `LEAD_MINUTES` before
 * the dose until the dose itself. A narrow window keyed to the cron's period
 * would mean one late or missed run silently costs a patient their 2am
 * reminder, and the second dose is the one most often skipped already. Sending
 * late is worth doing; not sending is not.
 *
 * Nothing is sent *after* the dose time. A message at 03:00 saying to drink the
 * 02:00 dose is worse than silence -- the patient has either done it, or is
 * asleep and cannot fix it, and the app would be telling them they have failed.
 *
 * `alreadySent` is what keeps a fifteen-minute cron from sending twice.
 */
export function dueReminders(
  plan: readonly PlanDay[],
  now: Date,
  alreadySent: ReadonlySet<string> = new Set(),
): DueReminder[] {
  return remindableSteps(plan).flatMap((step) => {
    const happensAt = stepInstant(step)
    const dueAt = new Date(happensAt.getTime() - LEAD_MINUTES * 60_000)
    const key = reminderKey(step)

    if (alreadySent.has(key)) return []
    if (now < dueAt || now >= happensAt) return []
    return [{ step, key, dueAt, happensAt }]
  })
}
