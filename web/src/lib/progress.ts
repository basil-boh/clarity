import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { GLASS_ML, dosesFor, totalDoseMl } from '@/domain/prep'
import type { BowelScalePoint, DietAnswer } from '@/domain/progress'

/**
 * What the patient has actually done, as opposed to what they were asked to do.
 *
 * Held in a signed cookie for the same reason the OTP cooldown is: there is no
 * database yet, and module-level state does not survive a cold start or reach a
 * second instance. A cookie is small, per-device and survives both — which is
 * honest for a prototype and wrong for a ward, so this module is written as the
 * one seam to move when a real store exists. Nothing else reads the cookie.
 *
 * It is deliberately *not* in the session token: that is issued at sign-in and
 * would then carry stale progress for twelve hours.
 */

const COOKIE = 'clarity_progress'
const MAX_AGE = 60 * 60 * 24 * 14 // the run-up is a week; a fortnight covers a reschedule

export type Progress = {
  /** Dose id → millilitres recorded. */
  readonly doses: Record<string, number>
  /** Step uids (`offset:id`) the patient has ticked off. */
  readonly completed: readonly string[]
  /** Glasses of clear fluid recorded today. */
  readonly fluidGlasses: number
  /** Where the patient is on the department's own bowel scale, 1-5. */
  readonly stoolPoint: BowelScalePoint | null
  /** Day offset (`-3`, `-2`, `-1`) → how the diet day went. */
  readonly dietDays: Record<string, DietAnswer>
}

const EMPTY: Progress = {
  doses: {},
  completed: [],
  fluidGlasses: 0,
  stoolPoint: null,
  dietDays: {},
}

function secret(): string {
  const raw = process.env.SESSION_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is not set. Generate one: openssl rand -base64 32')
    }
    return 'clarity-dev-secret-not-for-production-use'
  }
  return raw
}

const sign = (v: string) => createHmac('sha256', secret()).update(v).digest('base64url')

function equal(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export async function readProgress(): Promise<Progress> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return EMPTY
  const [payload, mac] = raw.split('.')
  if (!payload || !mac || !equal(mac, sign(payload))) return EMPTY
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Progress
    return {
      doses: parsed.doses ?? {},
      completed: Array.isArray(parsed.completed) ? parsed.completed.slice(0, 200) : [],
      fluidGlasses: Math.max(0, Math.min(Number(parsed.fluidGlasses) || 0, 30)),
      stoolPoint: parsed.stoolPoint ?? null,
      dietDays: parsed.dietDays ?? {},
    }
  } catch {
    return EMPTY
  }
}

export async function writeProgress(next: Progress): Promise<void> {
  const payload = Buffer.from(JSON.stringify(next)).toString('base64url')
  ;(await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

/**
 * Record a dose, clamped to what was prescribed.
 *
 * The clamp is the point: the app must never help a patient past the prescribed
 * volume, and a tracker that lets the number run to 1250ml of a 1000ml dose is
 * quietly telling them that was fine. See `NEVER` in `domain/progress.ts`.
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

export async function toggleStep(uid: string): Promise<Progress> {
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

/**
 * Clear fluid, in glasses.
 *
 * Capped at 30 rather than at the 8-glass target: the target is what the plan
 * asks for, not a limit, and a patient who drank twelve should be able to say
 * so. Unlike the purgative, there is no ceiling this app has to enforce.
 */
export async function recordFluid(glasses: number): Promise<Progress> {
  const current = await readProgress()
  const next: Progress = { ...current, fluidGlasses: Math.max(0, Math.min(glasses, 30)) }
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
