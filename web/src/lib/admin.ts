import 'server-only'

import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'

import type { ReviewedMedication } from '@/domain/medications'
import type { Language, Reader } from '@/domain/prep'
import { medicationsOf } from '@/lib/medications-store'
import { livePatient, type LivePatient } from '@/lib/patients'
import { prepTimingFrom } from '@/lib/progress'
import { progressOf, type Progress } from '@/lib/progress-store'
import { db, logDbError } from '@/lib/supabase'

/**
 * The department's side: who is booked, and for when.
 *
 * ── Who gets in ────────────────────────────────────────────────────────────
 *
 * `ADMIN_PASSWORD` unset means there is no admin at all: every /admin route is
 * a 404, so a deployment that never set one cannot be configured by anyone.
 * Set, it is one shared password -- enough for a pilot run by one or two
 * people, and the thing to replace with real staff accounts before a ward
 * depends on it.
 *
 * The admin cookie is its own token, not a flag on the patient session: a
 * different cookie, scoped to /admin, signed for a different audience, so a
 * patient's session can never be presented as an admin one. It also carries a
 * fingerprint of the password, so changing `ADMIN_PASSWORD` signs every admin
 * out.
 *
 * ── Why these queries do not go through `patientScope` ─────────────────────
 *
 * Every patient-facing read is narrowed to the phone in the verified session,
 * and `patientScope()` exists so that filter cannot be forgotten. The admin is
 * the one place that legitimately reads the whole ward, so it uses `db()`
 * directly -- and `requireAdmin()` is what stands in front of it instead. Every
 * page and every server action under /admin calls it first.
 */

const COOKIE = 'clarity_admin'
const AUDIENCE = 'clarity-admin'
const MAX_AGE = 60 * 60 * 8 // a working day

function password(): string | null {
  return process.env.ADMIN_PASSWORD || null
}

function secret(): Uint8Array {
  const raw = process.env.SESSION_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is not set. Generate one: openssl rand -base64 32')
    }
    return new TextEncoder().encode('clarity-dev-secret-not-for-production-use')
  }
  return new TextEncoder().encode(raw)
}

export function adminEnabled(): boolean {
  return password() !== null
}

/** Hashed first so the comparison is constant-time whatever the lengths. */
export function passwordMatches(attempt: string): boolean {
  const expected = password()
  if (!expected) return false
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(attempt), digest(expected))
}

/** Keyed on SESSION_SECRET, so the cookie says nothing about the password itself. */
function fingerprint(): string {
  return createHmac('sha256', secret())
    .update(`admin:${password() ?? ''}`)
    .digest('base64url')
    .slice(0, 22)
}

export async function createAdminSession(): Promise<void> {
  const token = await new SignJWT({ fp: fingerprint() })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: MAX_AGE,
  })
}

export async function readAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: AUDIENCE })
    return payload.fp === fingerprint()
  } catch {
    return false
  }
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies()
  jar.delete({ name: COOKIE, path: '/admin' })
}

/** The gate. A 404 when there is no admin, the sign-in form when not signed in. */
export async function requireAdmin(): Promise<void> {
  if (!adminEnabled()) notFound()
  if (!(await readAdmin())) redirect('/admin')
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export type AdminProcedure = {
  readonly id: string
  /** `yyyy-MM-dd` */
  readonly date: string
  /** `HH:mm` */
  readonly arriveAt: string
  readonly hospital: string
  readonly location: string
  readonly departmentPhone: string
}

export type AdminPatient = {
  readonly phone: string
  readonly displayName: string
  readonly language: Language
  readonly reader: Reader
  /** The latest booking, which is the one the patient's screens read. */
  readonly procedure: AdminProcedure | null
  /** Whether the patient has recorded anything: doses, fluids, diet, steps. */
  readonly recorded: boolean
}

export type PatientInput = {
  readonly phone: string
  readonly displayName: string
  readonly reader: Reader
  readonly date: string
  readonly arriveAt: string
  readonly hospital: string
  readonly location: string
  readonly departmentPhone: string
}

type ProcedureRow = {
  id: string
  scheduled_for: string
  arrive_at: string | null
  hospital: string
  location: string
  department_phone: string
}

type PatientRow = {
  phone: string
  display_name: string
  language: string
  reader: string
  web_procedures: ProcedureRow[]
  // One-to-one embeds come back as an object, one-to-many as an array.
  web_progress: { phone: string } | { phone: string }[] | null
  web_doses: { dose_id: string }[]
}

const COLUMNS =
  'phone, display_name, language, reader, ' +
  'web_procedures (id, scheduled_for, arrive_at, hospital, location, department_phone), ' +
  'web_progress (phone), web_doses (dose_id)'

const LANGUAGES: readonly Language[] = ['en', 'zh', 'ms', 'ta']

function toPatient(row: PatientRow): AdminPatient {
  const latest = [...(row.web_procedures ?? [])].sort((a, b) =>
    b.scheduled_for.localeCompare(a.scheduled_for),
  )[0]
  const progress = Array.isArray(row.web_progress) ? row.web_progress[0] : row.web_progress

  return {
    phone: row.phone,
    displayName: row.display_name,
    language: LANGUAGES.includes(row.language as Language) ? (row.language as Language) : 'en',
    reader: row.reader === 'caregiver' ? 'caregiver' : 'patient',
    procedure: latest
      ? {
          id: latest.id,
          date: latest.scheduled_for,
          arriveAt: (latest.arrive_at ?? '08:00').slice(0, 5),
          hospital: latest.hospital,
          location: latest.location,
          departmentPhone: latest.department_phone,
        }
      : null,
    recorded: Boolean(progress) || (row.web_doses ?? []).length > 0,
  }
}

/** Soonest procedure first; anyone with nothing booked goes to the bottom. */
export async function listPatients(): Promise<AdminPatient[]> {
  const { data, error } = await db().from('web_patients').select(COLUMNS).returns<PatientRow[]>()
  if (error) {
    logDbError('admin list', error)
    throw new Error('Could not read the patient list.')
  }
  return data.map(toPatient).sort((a, b) => {
    if (!a.procedure) return b.procedure ? 1 : a.displayName.localeCompare(b.displayName)
    if (!b.procedure) return -1
    return a.procedure.date.localeCompare(b.procedure.date)
  })
}

export async function getPatient(phone: string): Promise<AdminPatient | null> {
  const { data, error } = await db()
    .from('web_patients')
    .select(COLUMNS)
    .eq('phone', phone)
    .returns<PatientRow[]>()
    .maybeSingle()
  if (error) {
    logDbError('admin get', error)
    throw new Error('Could not read the patient.')
  }
  return data ? toPatient(data) : null
}

export type ChatMessage = {
  readonly id: string
  readonly role: 'patient' | 'assistant'
  readonly content: string
  readonly escalated: boolean
  /** Which `NEVER` rule replaced the reply, if one did. */
  readonly blockedRule: string | null
  readonly at: string
}

export type PatientDetails = {
  readonly patient: AdminPatient
  /**
   * The booking with what they recorded folded in -- through `livePatient`,
   * the same merge their own screens use, so the flag here is the flag they
   * see. Null when nothing is booked, since there is no plan to measure against.
   */
  readonly live: LivePatient | null
  readonly progress: Progress
  /** When they last recorded anything, or null if they never have. */
  readonly lastRecordedAt: string | null
  /** Oldest first, most recent `CHAT_LIMIT` messages. */
  readonly chat: readonly ChatMessage[]
  /** Sign-in codes requested. Not sign-ins: a code can be asked for and never used. */
  readonly codes: { readonly sends: number; readonly lastSentAt: string } | null
  /** Medication instructions the patient checked and added to their plan. */
  readonly medications: readonly ReviewedMedication[]
}

const CHAT_LIMIT = 200

type ChatRow = {
  id: string
  role: string
  content: string
  escalated: boolean
  blocked_rule: string | null
  created_at: string
}

/** Everything held against one number, for the patient page. */
export async function patientDetails(phone: string): Promise<PatientDetails | null> {
  const patient = await getPatient(phone)
  if (!patient) return null

  const client = db()
  const [progress, medications, progressStamp, doseStamps, chat, codes] = await Promise.all([
    progressOf(phone),
    medicationsOf(phone),
    client.from('web_progress').select('updated_at').eq('phone', phone).maybeSingle(),
    client.from('web_doses').select('updated_at').eq('phone', phone),
    client
      .from('web_chat_messages')
      .select('id, role, content, escalated, blocked_rule, created_at')
      .eq('phone', phone)
      // Both halves of an exchange are one insert and share a timestamp, so
      // role breaks the tie: reversed below, the question comes before its reply.
      .order('created_at', { ascending: false })
      .order('role', { ascending: true })
      .limit(CHAT_LIMIT)
      .returns<ChatRow[]>(),
    client.from('web_otp_sends').select('sends, last_sent_at').eq('phone', phone).maybeSingle(),
  ])

  for (const [where, result] of [
    ['web_progress', progressStamp],
    ['web_doses', doseStamps],
    ['web_chat_messages', chat],
    ['web_otp_sends', codes],
  ] as const) {
    if (result.error) {
      logDbError(`admin details ${where}`, result.error)
      throw new Error('Could not read everything held for this patient.')
    }
  }

  const stamps = [progressStamp.data?.updated_at, ...(doseStamps.data ?? []).map((d) => d.updated_at)]
    .filter((s): s is string => typeof s === 'string')
    .sort()

  const live = patient.procedure
    ? await livePatient(phone, progress, prepTimingFrom(progress.doses))
    : null

  return {
    patient,
    live,
    progress,
    lastRecordedAt: stamps.at(-1) ?? null,
    chat: (chat.data ?? []).reverse().map((row) => ({
      id: row.id,
      role: row.role === 'assistant' ? 'assistant' : 'patient',
      content: row.content,
      escalated: row.escalated,
      blockedRule: row.blocked_rule,
      at: row.created_at,
    })),
    codes: codes.data ? { sends: codes.data.sends, lastSentAt: codes.data.last_sent_at } : null,
    medications,
  }
}

function procedureRow(input: PatientInput) {
  return {
    phone: input.phone,
    scheduled_for: input.date,
    arrive_at: input.arriveAt,
    hospital: input.hospital,
    location: input.location,
    department_phone: input.departmentPhone,
  }
}

/**
 * Two inserts, not one transaction: supabase-js has none. If the procedure
 * insert fails the patient row stays, reads as "nothing booked", and saving the
 * form again from the edit page fills in the procedure.
 */
export async function createPatient(input: PatientInput): Promise<'created' | 'exists'> {
  const client = db()
  const patient = await client.from('web_patients').insert({
    phone: input.phone,
    display_name: input.displayName,
    reader: input.reader,
  })
  if (patient.error) {
    if (patient.error.code === '23505') return 'exists'
    logDbError('admin create patient', patient.error)
    throw new Error('Could not save the patient.')
  }

  const procedure = await client.from('web_procedures').insert(procedureRow(input))
  if (procedure.error) {
    logDbError('admin create procedure', procedure.error)
    throw new Error('Saved the patient, but not the procedure. Open them and save again.')
  }
  return 'created'
}

/** Edits the latest booking in place, or adds one if there is none. */
export async function updatePatient(input: PatientInput): Promise<'updated' | 'missing'> {
  const client = db()
  const patient = await client
    .from('web_patients')
    .update({
      display_name: input.displayName,
      reader: input.reader,
      updated_at: new Date().toISOString(),
    })
    .eq('phone', input.phone)
    .select('phone')
  if (patient.error) {
    logDbError('admin update patient', patient.error)
    throw new Error('Could not save the patient.')
  }
  if (patient.data.length === 0) return 'missing'

  const latest = await client
    .from('web_procedures')
    .select('id')
    .eq('phone', input.phone)
    .order('scheduled_for', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latest.error) {
    logDbError('admin read procedure', latest.error)
    throw new Error('Could not read the procedure.')
  }

  const procedure = latest.data
    ? await client
        .from('web_procedures')
        .update(procedureRow(input))
        .eq('id', latest.data.id)
        .eq('phone', input.phone)
    : await client.from('web_procedures').insert(procedureRow(input))
  if (procedure.error) {
    logDbError('admin save procedure', procedure.error)
    throw new Error('Could not save the procedure.')
  }
  return 'updated'
}

/** Procedures, progress, doses and chat all go with it: every FK cascades. */
export async function deletePatient(phone: string): Promise<void> {
  const { error } = await db().from('web_patients').delete().eq('phone', phone)
  if (error) {
    logDbError('admin delete', error)
    throw new Error('Could not delete the patient.')
  }
}

/**
 * Wipes what the patient recorded and keeps who they are and when they are
 * booked -- for running the same number through the prep again.
 */
export async function resetRecorded(phone: string): Promise<void> {
  const client = db()
  const results = await Promise.all(
    ['web_progress', 'web_doses', 'web_chat_messages'].map((table) =>
      client.from(table).delete().eq('phone', phone),
    ),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    logDbError('admin reset', failed.error)
    throw new Error('Could not reset what the patient recorded.')
  }
}
