import 'server-only'

import type { Registration } from '@/domain/registration'
import { usingDatabase } from '@/lib/source'
import { logDbError, patientScope } from '@/lib/supabase'

/**
 * The patient's own record, written by the patient.
 *
 * There is no hospital system behind this app, so `web_patients` and
 * `web_procedures` are filled in from the welcome form rather than seeded by a
 * department. The rows are the same ones `lib/patients.ts` reads -- nothing
 * downstream knows or cares where they came from.
 *
 * Two writes, in order, because the procedure row is foreign-keyed to the
 * patient row. They are not a transaction: PostgREST has no way to ask for one
 * across two calls. If the second fails the patient exists with no procedure,
 * which `findPatient` already treats as "nothing booked" and which the form
 * will simply write again on the next attempt. The reverse order would leave a
 * procedure with no patient, which the foreign key refuses outright.
 */

/** The logistics a department would normally supply, which no one here can. */
const UNKNOWN_LOGISTICS = {
  arrive_at: '08:00',
  hospital: '',
  location: '',
  department_phone: '',
}

export type SaveOutcome = 'saved' | 'no-database' | 'failed'

export async function saveRegistration(
  phone: string,
  registration: Registration,
): Promise<SaveOutcome> {
  if (!usingDatabase()) return 'no-database'

  const scope = patientScope(phone)

  const { error: patientError } = await scope.client.from('web_patients').upsert(
    {
      phone,
      display_name: registration.name,
      language: registration.language,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' },
  )
  if (patientError) {
    logDbError('web_patients upsert', patientError)
    return 'failed'
  }

  // A patient who corrects their date must end up with one procedure, not two.
  // `findPatient` reads the latest by `scheduled_for`, so a stale row with a
  // later date would win and quietly restore the date they just corrected.
  const { error: clearError } = await scope.client
    .from('web_procedures')
    .delete()
    .eq('phone', phone)
  if (clearError) {
    logDbError('web_procedures clear', clearError)
    return 'failed'
  }

  const { error: procedureError } = await scope.client.from('web_procedures').insert({
    phone,
    scheduled_for: registration.date,
    ...UNKNOWN_LOGISTICS,
  })
  if (procedureError) {
    logDbError('web_procedures insert', procedureError)
    return 'failed'
  }

  return 'saved'
}
