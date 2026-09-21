import 'server-only'

import { parseStoolCheck, stoolPointFor } from '@/domain/stool-check'

import { GLASS_ML, dosesFor, todayIn, totalDoseMl } from '@/domain/prep'
import { fluidOn, type BowelScalePoint, type DietAnswer } from '@/domain/progress'
import { usingDatabase } from '@/lib/source'
import { EMPTY, loadProgress, saveProgress, type Progress } from '@/lib/progress-store'

/**
 * What the patient has actually done, as opposed to what they were asked to do.
 *
 * This module owns the *rules* -- the dose clamp, the fluid cap, how a recorded
 * volume becomes the prep-timing signal. Where the numbers are kept is
 * `lib/progress-store.ts`: a row per patient in Supabase, or a signed cookie,
 * following the one switch in `lib/source.ts` that also decides where the
 * patient record itself comes from.
 *
 * It is deliberately *not* in the session token: that is issued at sign-in and
 * would then carry stale progress for twelve hours.
 */

export type { Progress }
export { usingDatabase }

export async function readProgress(): Promise<Progress> {
  return loadProgress()
}

export async function writeProgress(next: Progress): Promise<void> {
  return saveProgress(next)
}

/** The empty record, for callers that need a starting point without a read. */
export const NOTHING_RECORDED = EMPTY

/**
 * Record a dose, clamped to what was prescribed.
 *
 * The clamp is the point: the app must never help a patient past the prescribed
 * volume, and a tracker that lets the number run to 1250ml of a 1000ml dose is
 * quietly telling them that was fine. See `NEVER` in `domain/progress.ts`, and
 * `web_doses_within_prescription` in the migration, which is the same rule where
 * it cannot be bypassed.
 */
export async function recordDose(doseId: string, ml: number): Promise<Progress> {
  const dose = dosesFor().find((d) => d.id === doseId)
  if (!dose) return readProgress()
  const current = await readProgress()
  const next: Progress = {
    ...current,
    doses: { ...current.doses, [doseId]: Math.max(0, Math.min(ml, dose.volumeMl)) },
  }
  await writeProgress(next)
  return next
}

/** `offset:id`, as `buildPlan` makes them. Anything else is not a step. */
const STEP_UID = /^-?\d{1,2}:[a-z0-9-]{1,48}$/

export async function toggleStep(uid: string): Promise<Progress> {
  // Reached from a server action, so the uid is whatever the caller sent.
  if (typeof uid !== 'string' || !STEP_UID.test(uid)) return readProgress()
  const current = await readProgress()
  const has = current.completed.includes(uid)
  const next: Progress = {
    ...current,
    completed: has
      ? current.completed.filter((u) => u !== uid)
      : [...current.completed, uid].slice(-200),
  }
  await writeProgress(next)
  return next
}

/** Glasses recorded against a dose, for the counter the patient reads. */
export function glassesOf(ml: number): number {
  return Math.round(ml / GLASS_ML)
}

/**
 * Prep timing, derived from what was actually drunk.
 *
 * This is the link that makes the tracker worth having: logging a glass moves
 * the same signal the ward reads on the morning. Returns null when the patient
 * has recorded nothing at all, which stays `UNMEASURED` rather than becoming a
 * zero — a patient who never opened the app has not failed their prep.
 */
export function prepTimingFrom(doses: Record<string, number>): number | null {
  const recorded = Object.values(doses).reduce((sum, ml) => sum + ml, 0)
  if (recorded <= 0) return null
  return Math.min(1, recorded / totalDoseMl())
}

/** Glasses of clear fluid recorded today, Singapore time. */
export function fluidToday(progress: Progress): number {
  return fluidOn(progress.fluidDays, todayIn())
}

/**
 * Clear fluid, in glasses, for today.
 *
 * Capped at 30 rather than at the 8-glass target: the target is what the plan
 * asks for, not a limit, and a patient who drank twelve should be able to say
 * so. Unlike the purgative, there is no ceiling this app has to enforce.
 */
export async function recordFluid(glasses: number): Promise<Progress> {
  const current = await readProgress()
  const next: Progress = {
    ...current,
    fluidDays: { ...current.fluidDays, [todayIn()]: Math.max(0, Math.min(glasses, 30)) },
  }
  await writeProgress(next)
  return next
}

/**
 * Where the patient is on the department's bowel scale.
 *
 * Recording a point raises a flag and informs the patient. It does **not**
 * decide whether the scope goes ahead -- that is `NEVER[1]`, and the screen
 * that collects this says so in as many words.
 */
export async function recordStool(point: BowelScalePoint | null): Promise<Progress> {
  const current = await readProgress()
  const next: Progress = { ...current, stoolPoint: point }
  await writeProgress(next)
  return next
}

/** How one diet day went, keyed by its offset so it survives a reschedule. */
export async function recordDietDay(offset: number, answer: DietAnswer): Promise<Progress> {
  const current = await readProgress()
  const next: Progress = {
    ...current,
    dietDays: { ...current.dietDays, [String(offset)]: answer },
  }
  await writeProgress(next)
  return next
}

/** Save observations together; never derive a clear result from colour or frequency. */
export async function recordStoolCheck(input: unknown, procedureDate: string): Promise<void> {
  const check = parseStoolCheck(input)
  if (!check) throw new Error('Please complete the stool check-in.')
  const current = await readProgress()
  await writeProgress({ ...current, stoolCheck: { ...check, recordedAt: new Date().toISOString(), procedureDate }, stoolPoint: stoolPointFor(check) })
}
