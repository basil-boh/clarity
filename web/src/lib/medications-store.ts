import 'server-only'

import {
  medicationIssues,
  parseSavedMedications,
  type ReviewedMedication,
} from '@/domain/medications'
import { findPatient } from '@/lib/patients'
import { readSession } from '@/lib/session'
import { usingDatabase } from '@/lib/source'
import { logDbError, patientScope } from '@/lib/supabase'

/**
 * The medication instructions a patient has checked and added to their plan.
 *
 * Only those. The photographs are never stored -- they go to OpenAI to be read
 * and are dropped -- and neither is anything still being reviewed. What is kept
 * is the confirmed text: the medicine, take or hold, the times, the sheet's own
 * words. It is kept so the reminders are still there when the patient comes
 * back, and so the department can see them in /admin: a held blood thinner is
 * exactly what the ward wants to know on the morning.
 *
 * Database only. On the demo source there is nowhere to keep them, and the
 * screen says they last until the page is left, as it always did.
 */

/**
 * Logged once per failure. A missing table -- Postgres 42P01, or PostgREST's
 * PGRST205 when its schema cache has not got it -- means the migration has not
 * been applied, which is worth saying in so many words.
 */
function logError(action: 'read' | 'write', error: unknown) {
  const code = (error as { code?: string } | null)?.code
  const missing = code === '42P01' || code === 'PGRST205'
  logDbError(
    missing
      ? 'web_medications missing, apply 0002_medications_and_fluid_days.sql'
      : `web_medications ${action}`,
    error,
  )
}

async function read(phone: string): Promise<ReviewedMedication[]> {
  const { data, error } = await patientScope(phone)
    .select<{ entries: unknown }>('web_medications', 'entries')
    .maybeSingle()
  if (error) {
    // Degrades to "nothing saved" rather than failing the whole Plan page: the
    // plan itself matters more than the reminders layered on it.
    logError('read', error)
    return []
  }
  return parseSavedMedications(data?.entries)
}

/** The signed-in patient's saved entries. */
export async function loadMedications(): Promise<ReviewedMedication[]> {
  if (!usingDatabase()) return []
  const session = await readSession()
  return session ? read(session.phone) : []
}

/** Someone else's, for /admin only -- every caller sits behind `requireAdmin()`. */
export async function medicationsOf(phone: string): Promise<ReviewedMedication[]> {
  return read(phone)
}

/**
 * Replace the signed-in patient's saved entries.
 *
 * Returns false when there is nowhere to keep them, or the write failed, and
 * the screen says so -- a patient told their reminders are saved when they are
 * not stops keeping them anywhere else. Entries with open issues are dropped
 * here as well as on screen, since this arrives from the browser.
 */
export async function saveMedications(entries: unknown): Promise<boolean> {
  if (!usingDatabase()) return false
  const session = await readSession()
  if (!session) return false

  try {
    const patient = await findPatient(session.phone)
    if (!patient) return false

    const keep = parseSavedMedications(entries).filter(
      (entry) => medicationIssues(entry, patient.procedure.date).length === 0,
    )
    const { error } = await patientScope(session.phone)
      .client.from('web_medications')
      .upsert(
        { phone: session.phone, entries: keep, updated_at: new Date().toISOString() },
        { onConflict: 'phone' },
      )
    if (error) {
      logError('write', error)
      return false
    }
    return true
  } catch (error) {
    logError('write', error)
    return false
  }
}
