import 'server-only'

import { supabaseConfigured } from '@/lib/supabase'

/**
 * Which data source is in play — one switch, for everything about a patient.
 *
 * It governs where the record is read, where what the patient recorded is
 * written, and whether the assistant's transcript is kept. They move together
 * on purpose. Splitting them looks harmless and is not: with patients coming
 * from the fixture and progress going to Postgres, the first glass a demo
 * patient logs is a write against a `web_patients` row that does not exist, and
 * the patient is told their prep could not be saved.
 *
 * `PATIENT_SOURCE` set explicitly wins. Left unset it follows whether a
 * database is configured, which is the intuitive behaviour -- but a production
 * build with neither refuses rather than quietly serving three fictional
 * Singaporeans to a real patient. Same reasoning as `lib/otp.ts` refusing to
 * fall back to demo codes in production.
 */
export function patientSource(): 'demo' | 'supabase' {
  const declared = process.env.PATIENT_SOURCE

  if (declared === 'supabase') return 'supabase'

  if (declared === 'demo') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PATIENT_SOURCE=demo is not allowed in production.')
    }
    return 'demo'
  }

  if (supabaseConfigured()) return 'supabase'

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'No patient source. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, ' +
        'or PATIENT_SOURCE=demo for a non-production build.',
    )
  }

  return 'demo'
}

export function usingDatabase(): boolean {
  return patientSource() === 'supabase'
}
