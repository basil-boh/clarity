import 'server-only'

import { NO_ANSWERS, parseAnswers, type Answers } from '@/domain/questionnaire'
import { readSession } from '@/lib/session'
import { usingDatabase } from '@/lib/source'
import { logDbError, patientScope } from '@/lib/supabase'

/**
 * The first-sign-in questionnaire, kept against the patient's number.
 *
 * Database only. On the demo source nobody is asked -- there is nowhere to keep
 * the answers, and asking again on every visit would be worse than not asking.
 * If the table is missing (0003 not applied) nobody is asked either, and it is
 * logged: the questions are a nicety, never a gate in front of prep
 * instructions.
 */

export type Stored = {
  readonly answers: Answers
  readonly skipped: boolean
  readonly answeredAt: string
}

type Row = {
  age_range: string | null
  gender: string | null
  ethnicity: string | null
  diets: string[] | null
  skipped: boolean
  answered_at: string
}

function logError(action: 'read' | 'write', error: unknown) {
  const code = (error as { code?: string } | null)?.code
  const missing = code === '42P01' || code === 'PGRST205'
  logDbError(
    missing ? 'web_questionnaire missing, apply 0003_questionnaire.sql' : `web_questionnaire ${action}`,
    error,
  )
}

/**
 * What this number answered: `null` if never asked, `undefined` if it cannot be
 * told -- no database, or the read failed. Callers treat `undefined` as "do not
 * ask", so a broken table never locks anyone into a questionnaire.
 */
async function read(phone: string): Promise<Stored | null | undefined> {
  if (!usingDatabase()) return undefined
  const { data, error } = await patientScope(phone)
    .select<Row>('web_questionnaire', 'age_range, gender, ethnicity, diets, skipped, answered_at')
    .maybeSingle()
  if (error) {
    logError('read', error)
    return undefined
  }
  if (!data) return null
  return {
    answers: parseAnswers({
      ageRange: data.age_range,
      gender: data.gender,
      ethnicity: data.ethnicity,
      diets: data.diets,
    }),
    skipped: data.skipped,
    answeredAt: data.answered_at,
  }
}

/** Whether this number should be sent to the questions after signing in. */
export async function needsQuestionnaire(phone: string): Promise<boolean> {
  return (await read(phone)) === null
}

/** The signed-in patient's answers, or none. */
export async function loadAnswers(): Promise<Answers> {
  const session = await readSession()
  if (!session) return NO_ANSWERS
  return (await read(session.phone))?.answers ?? NO_ANSWERS
}

/** Whether the signed-in patient has answered, skipped, or not been asked. */
export async function questionnaireState(): Promise<'answered' | 'skipped' | 'unasked' | 'unavailable'> {
  const session = await readSession()
  const stored = session ? await read(session.phone) : undefined
  if (stored === undefined) return 'unavailable'
  if (stored === null) return 'unasked'
  return stored.skipped ? 'skipped' : 'answered'
}

/** Someone else's, for /admin only -- every caller sits behind `requireAdmin()`. */
export async function questionnaireOf(phone: string): Promise<Stored | null> {
  return (await read(phone)) ?? null
}

/**
 * Save the signed-in patient's answers, or that they skipped. False if there
 * is nowhere to keep them; the caller moves on either way.
 */
export async function saveAnswers(answers: Answers, skipped: boolean): Promise<boolean> {
  const session = await readSession()
  if (!session || !usingDatabase()) return false
  const clean = skipped ? NO_ANSWERS : parseAnswers(answers)
  const { error } = await patientScope(session.phone)
    .client.from('web_questionnaire')
    .upsert(
      {
        phone: session.phone,
        age_range: clean.ageRange,
        gender: clean.gender,
        ethnicity: clean.ethnicity,
        diets: [...clean.diets],
        skipped,
        answered_at: new Date().toISOString(),
      },
      { onConflict: 'phone' },
    )
  if (error) {
    logError('write', error)
    return false
  }
  return true
}
