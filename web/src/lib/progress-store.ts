import 'server-only'

import { parseStoolCheck, type StoolCheck } from '@/domain/stool-check'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { dosesFor, todayIn } from '@/domain/prep'
import {
  DIET_ANSWERS,
  fluidOn,
  type BowelScalePoint,
  type DietAnswer,
  type FluidDays,
} from '@/domain/progress'
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
  /** Latest guided, patient-reported stool observations. */
  readonly stoolCheck?: StoolCheck | null
  /** Dose id → millilitres recorded. */
  readonly doses: Record<string, number>
  /** Step uids (`offset:id`) the patient has ticked off. */
  readonly completed: readonly string[]
  /** Singapore date (`yyyy-MM-dd`) → glasses of clear fluid that day. */
  readonly fluidDays: FluidDays
  /** Where the patient is on the department's own bowel scale, 1-5. */
  readonly stoolPoint: BowelScalePoint | null
  /** Day offset (`-3`, `-2`, `-1`) → how the diet day went. */
  readonly dietDays: Record<string, DietAnswer>
}

export const EMPTY: Progress = {
  doses: {},
  completed: [],
  fluidDays: {},
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

/** The prep is a week; a fortnight of days covers it and a reschedule. */
const FLUID_DAYS_KEPT = 14

function cleanFluidDays(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}
  const days = Object.entries(value as Record<string, unknown>)
    .filter(([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .map(([date, glasses]) => [date, cleanGlasses(glasses)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-FLUID_DAYS_KEPT)
  return Object.fromEntries(days)
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
    fluidDays: cleanFluidDays(raw.fluidDays),
    stoolPoint: cleanStoolPoint(raw.stoolPoint),
    stoolCheck: parseStoolCheck(raw.stoolCheck),
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
  stool_check?: unknown
  completed: string[] | null
  fluid_glasses: number | null
  /** Absent until `0002_medications_and_fluid_days.sql` has been applied. */
  fluid_days?: unknown
  stool_point: number | null
  diet_days: unknown
  updated_at: string | null
}

const PROGRESS_COLUMNS = 'stool_check, completed, fluid_glasses, fluid_days, stool_point, diet_days, updated_at'
/** Before `0002_medications_and_fluid_days.sql` added `fluid_days`. */
const LEGACY_PROGRESS_COLUMNS = 'completed, fluid_glasses, stool_point, diet_days, updated_at'

/** Postgres: undefined column. PostgREST: a column missing from its schema cache. */
const missingColumn = (error: { code?: string } | null) =>
  error?.code === '42703' || error?.code === 'PGRST204'

/**
 * Fluid by day, from a row. Before `fluid_days` existed the one running count
 * was `fluid_glasses`, and the last day it can be trusted for is the day the
 * row was last written -- so that is the day it is filed under.
 */
function fluidDaysOf(row: ProgressRow | null): unknown {
  const days = cleanFluidDays(row?.fluid_days)
  if (Object.keys(days).length > 0 || !row?.fluid_glasses || !row.updated_at) return days
  return { [todayIn(new Date(row.updated_at))]: row.fluid_glasses }
}

type DoseRow = { dose_id: string; consumed_ml: number }

async function readDb(phone: string): Promise<Progress> {
  const scope = patientScope(phone)

  const [firstRead, doseResult] = await Promise.all([
    scope.select<ProgressRow>('web_progress', PROGRESS_COLUMNS).maybeSingle(),
    scope.select<DoseRow>('web_doses', 'dose_id, consumed_ml'),
  ])

  // A database the new migration has not reached yet still reads, on the old
  // columns, rather than showing the patient an empty record.
  const withoutStoolCheck = missingColumn(firstRead.error)
    ? await scope.select<ProgressRow>('web_progress', PROGRESS_COLUMNS.replace('stool_check, ', '')).maybeSingle()
    : firstRead
  const progressResult = missingColumn(withoutStoolCheck.error)
    ? await scope.select<ProgressRow>('web_progress', LEGACY_PROGRESS_COLUMNS).maybeSingle()
    : withoutStoolCheck

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
    fluidDays: fluidDaysOf(row) as FluidDays,
    stoolPoint: cleanStoolPoint(row?.stool_point),
    stoolCheck: parseStoolCheck(row?.stool_check),
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

  const row = {
    phone,
    completed: [...next.completed],
    // Today's count, kept alongside `fluid_days` so the column still means what
    // it did to anything reading it, and so a database without `fluid_days`
    // files it under the right day (see `fluidDaysOf`).
    fluid_glasses: fluidOn(next.fluidDays, todayIn()),
    fluid_days: next.fluidDays,
    stool_point: next.stoolPoint,
    ...(next.stoolCheck ? { stool_check: next.stoolCheck } : {}),
    diet_days: next.dietDays,
    updated_at: new Date().toISOString(),
  }

  const progressWrite = async () => {
    const first = await scope.client.from('web_progress').upsert(row, { onConflict: 'phone' })
    if (!missingColumn(first.error)) return first
    // Not migrated yet: save everything but the per-day history.
    const { fluid_days: _, ...legacy } = row
    return scope.client.from('web_progress').upsert(legacy, { onConflict: 'phone' })
  }

  const writes: PromiseLike<{ error: unknown }>[] = [progressWrite()]

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

/**
 * Someone else's record, for /admin only.
 *
 * The one exception to the rule above, and deliberately a separate function
 * rather than an optional argument on `loadProgress`: a patient screen cannot
 * reach this by leaving a parameter off. Every caller sits behind
 * `requireAdmin()`. Database only -- the cookie backend is per-device and has
 * no record to look up by number.
 */
export async function progressOf(phone: string): Promise<Progress> {
  return readDb(phone)
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
