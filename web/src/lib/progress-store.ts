import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { dosesFor } from '@/domain/prep'
import { DIET_ANSWERS, type BowelScalePoint, type DietAnswer } from '@/domain/progress'
import { usingDatabase } from '@/lib/source'
import { logDbError, patientScope } from '@/lib/supabase'
import { readSession } from '@/lib/session'

/**
 * Where what the patient recorded is kept.
 *
 * This is the seam `lib/progress.ts` was written around: the rules -- the dose
 * clamp, the fluid cap, what counts as unmeasured -- live there and do not know
 * where the numbers are kept. Two backends implement the same two functions.
 *
 * **Supabase** is the real one. A row per patient in `web_progress`, a row per
 * dose in `web_doses`, both keyed on the verified phone number. It survives a
 * new browser, a cleared cache and the patient switching from their phone to
 * their daughter's laptop, and it is readable by the ward, which is the whole
 * point of recording anything.
 *
 * **The signed cookie** is the fallback, used on the demo source so the whole
 * flow runs with nothing but `npm install`. It is per-device and capped at
 * 4KB, which is wrong for a ward and fine for a prototype. It is chosen over
 * module-level state for the same reason the OTP cooldown was: module state
 * does not survive a cold start and does not reach a second instance, so two
 * requests could disagree about whether a dose had been drunk.
 */

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

export const EMPTY: Progress = {
  doses: {},
  completed: [],
  fluidGlasses: 0,
  stoolPoint: null,
  dietDays: {},
}

// ---------------------------------------------------------------------------
// Shapes that arrive from outside, normalised on the way in
// ---------------------------------------------------------------------------

const DIET_IDS = new Set<string>(DIET_ANSWERS.map((a) => a.id))

function cleanStoolPoint(value: unknown): BowelScalePoint | null {
  const n = Number(value)
  return Number.isInteger(n) && n >= 1 && n <= 5 ? (n as BowelScalePoint) : null
}

function cleanDietDays(value: unknown): Record<string, DietAnswer> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, DietAnswer> = {}
  for (const [offset, answer] of Object.entries(value as Record<string, unknown>)) {
    if (typeof answer === 'string' && DIET_IDS.has(answer)) out[offset] = answer as DietAnswer
  }
  return out
}

function cleanCompleted(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').slice(0, 200)
}

function cleanGlasses(value: unknown): number {
  return Math.max(0, Math.min(Math.round(Number(value) || 0), 30))
}

/**
 * The stored shape, brought back into range.
 *
 * Applied to both backends. The cookie is signed, so tampering is already
 * ruled out, and the database has check constraints -- but `diet_days` is
 * jsonb and a row written by hand in the SQL editor is not constrained at all.
 * A bad value here would propagate straight into the flag the ward reads.
 */
function normalise(raw: Partial<Progress> | null | undefined): Progress {
  if (!raw) return EMPTY
  return {
    doses: typeof raw.doses === 'object' && raw.doses ? raw.doses : {},
    completed: cleanCompleted(raw.completed),
    fluidGlasses: cleanGlasses(raw.fluidGlasses),
    stoolPoint: cleanStoolPoint(raw.stoolPoint),
    dietDays: cleanDietDays(raw.dietDays),
  }
}

// ---------------------------------------------------------------------------
// The cookie backend
// ---------------------------------------------------------------------------

const COOKIE = 'clarity_progress'
const MAX_AGE = 60 * 60 * 24 * 14 // the run-up is a week; a fortnight covers a reschedule

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

async function readCookie(): Promise<Progress> {
  const raw = (await cookies()).get(COOKIE)?.value
  if (!raw) return EMPTY
  const [payload, mac] = raw.split('.')
  if (!payload || !mac || !equal(mac, sign(payload))) return EMPTY
  try {
    return normalise(JSON.parse(Buffer.from(payload, 'base64url').toString()) as Progress)
  } catch {
    return EMPTY
  }
}

async function writeCookie(next: Progress): Promise<void> {
  const payload = Buffer.from(JSON.stringify(next)).toString('base64url')
  ;(await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

// ---------------------------------------------------------------------------
// The Supabase backend
// ---------------------------------------------------------------------------

type ProgressRow = {
  completed: string[] | null
  fluid_glasses: number | null
  stool_point: number | null
  diet_days: unknown
}

type DoseRow = { dose_id: string; consumed_ml: number }

async function readDb(phone: string): Promise<Progress> {
  const scope = patientScope(phone)

  const [progressResult, doseResult] = await Promise.all([
    scope
      .select<ProgressRow>('web_progress', 'completed, fluid_glasses, stool_point, diet_days')
      .maybeSingle(),
    scope.select<DoseRow>('web_doses', 'dose_id, consumed_ml'),
  ])

  // A read failure here is recoverable in a way `findPatient`'s is not: the
  // worst case is a screen showing "not recorded" for a signal that was in fact
  // recorded, which the patient can see and re-enter. Falling over the whole
  // page on the purge night, when the thing they came to do is log a glass,
  // would be the worse trade.
  if (progressResult.error) logDbError('web_progress read', progressResult.error)
  if (doseResult.error) logDbError('web_doses read', doseResult.error)

  const doses: Record<string, number> = {}
  for (const row of doseResult.data ?? []) {
    doses[row.dose_id] = Number(row.consumed_ml) || 0
  }

  const row = progressResult.data
  return normalise({
    doses,
    completed: row?.completed ?? [],
    fluidGlasses: row?.fluid_glasses ?? 0,
    stoolPoint: cleanStoolPoint(row?.stool_point),
    dietDays: cleanDietDays(row?.diet_days),
  })
}

/**
 * Write the whole record.
 *
 * Two statements, not one transaction, and that is a deliberate limit rather
 * than an oversight: the doses and the self-reported signals are never changed
 * by the same action -- `/doses` writes one, `/progress` writes the other -- so
 * there is no interleaving that leaves a patient half-saved. If a single action
 * ever writes both, this becomes an RPC.
 *
 * `prescribed_ml` is written from `dosesFor()` so the database has something to
 * check `consumed_ml` against. The clamp in `recordDose` should mean the
 * constraint never fires; it exists for the case where it does.
 */
async function writeDb(phone: string, next: Progress): Promise<void> {
  const scope = patientScope(phone)
  const prescribed = new Map(dosesFor().map((d) => [d.id, d.volumeMl]))

  const doseRows = Object.entries(next.doses)
    .filter(([id]) => prescribed.has(id))
    .map(([id, ml]) => ({
      phone,
      dose_id: id,
      prescribed_ml: prescribed.get(id)!,
      consumed_ml: Math.max(0, Math.round(ml)),
      updated_at: new Date().toISOString(),
    }))

  const writes: PromiseLike<{ error: unknown }>[] = [
    scope.client.from('web_progress').upsert(
      {
        phone,
        completed: [...next.completed],
        fluid_glasses: next.fluidGlasses,
        stool_point: next.stoolPoint,
        diet_days: next.dietDays,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone' },
    ),
  ]

  if (doseRows.length > 0) {
    writes.push(scope.client.from('web_doses').upsert(doseRows, { onConflict: 'phone,dose_id' }))
  }

  const results = await Promise.all(writes)
  for (const result of results) {
    if (result.error) {
      logDbError('progress write', result.error)
      // Writes do **not** degrade quietly. A tracker that says "saved" and did
      // not is worse than one that says it failed: the patient stops counting
      // glasses in their head, and the ward reads a prep that never happened.
      throw new Error('Could not save what you recorded. Please try again.')
    }
  }
}

// ---------------------------------------------------------------------------

/**
 * The patient's own record.
 *
 * Reads take the phone from the session rather than an argument, so no screen
 * can accidentally ask for someone else's -- the same reason `patientScope`
 * exists. No session means an empty record rather than an error: the pages that
 * call this sit behind a layout that has already redirected.
 */
export async function loadProgress(): Promise<Progress> {
  if (!usingDatabase()) return readCookie()
  const session = await readSession()
  if (!session) return EMPTY
  return readDb(session.phone)
}

export async function saveProgress(next: Progress): Promise<void> {
  if (!usingDatabase()) return writeCookie(next)
  const session = await readSession()
  if (!session) {
    // Reached only by a server action invoked without a session. Refusing is
    // the point: the alternative is a write with no patient to attribute it to.
    throw new Error('Not signed in.')
  }
  return writeDb(session.phone, next)
}
