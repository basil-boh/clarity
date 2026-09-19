import 'server-only'

import { dateFromToday, type Procedure, type Profile } from '@/domain/prep'
import type { Progress } from '@/lib/progress'
import { UNMEASURED, latestFluid, signalsFromInput, type Signals } from '@/domain/progress'
import { patientSource } from '@/lib/source'
import { logDbError, patientScope } from '@/lib/supabase'

/**
 * Where a patient record comes from.
 *
 * One module, one function -- `findPatient(phone)` -- so that swapping the demo
 * dataset for the hospital's own system is a change in this file and nowhere
 * else. The screens never reach for a database.
 *
 * There are two sources. The demo cohort below is a fixture keyed by phone
 * number, which is what lets the whole flow be demonstrated end to end without
 * a Supabase project. `PATIENT_SOURCE=supabase` reads the `web_patients` and
 * `web_procedures` tables from `supabase/migrations/0001_web_portal.sql`.
 */

export type Patient = {
  readonly phone: string
  readonly profile: Profile
  readonly procedure: Procedure
  readonly signals: Signals
  /** Step uids (`offset:id`) the patient has ticked off. */
  readonly completed: readonly string[]
}

// ---------------------------------------------------------------------------
// The demo cohort
// ---------------------------------------------------------------------------

/**
 * Three patients at three points in the run-up, because the interesting bugs in
 * a date-derived plan only show up at the boundaries. Dates are relative to
 * today so the fixture never goes stale.
 *
 * The seed half of `supabase/migrations/0001_web_portal.sql` is the same three,
 * as rows.
 */
function demoCohort(now = new Date()): Patient[] {
  const iso = (days: number) => dateFromToday(days, now)

  return [
    {
      // Deep in the wait -- the stretch a paper sheet cannot survive.
      phone: '+6591234567',
      profile: { displayName: 'Tan Wei Ming', language: 'en', reader: 'patient' },
      procedure: {
        date: iso(384),
        hospital: 'Singapore General Hospital',
        location: 'Block 3, Level 4 — Endoscopy Centre',
        arriveAt: '08:30',
        departmentPhone: '+6563265656',
      },
      signals: {
        dietCompliance: UNMEASURED,
        prepTiming: UNMEASURED,
        fluidIntake: UNMEASURED,
        bowelOutput: UNMEASURED,
      },
      completed: [],
    },
    {
      // Mid diet days: the experience half of the split.
      phone: '+6598765432',
      profile: { displayName: 'Siti Rahman', language: 'en', reader: 'patient' },
      procedure: {
        date: iso(2),
        hospital: 'Singapore General Hospital',
        location: 'Block 3, Level 4 — Endoscopy Centre',
        arriveAt: '07:45',
        departmentPhone: '+6563265656',
      },
      signals: {
        dietCompliance: 0.82,
        prepTiming: UNMEASURED,
        fluidIntake: 0.7,
        bowelOutput: UNMEASURED,
      },
      // offset:id -- the low-residue meal on the first diet day.
      completed: ['-3:low-residue', '-3:fluids-day', '-2:low-residue'],
    },
    {
      // The purge night, with the second dose still ahead: the outcome half.
      phone: '+6590001111',
      profile: { displayName: 'Lim Ah Kow', language: 'en', reader: 'caregiver' },
      procedure: {
        date: iso(1),
        hospital: 'Changi General Hospital',
        location: 'Medical Centre, Level 2',
        arriveAt: '09:00',
        departmentPhone: '+6567888833',
      },
      signals: {
        dietCompliance: 0.6,
        prepTiming: 0.55,
        fluidIntake: 0.8,
        bowelOutput: 0.45,
      },
      completed: [
        '-7:confirm-meds',
        '-7:arrange-escort',
        '-7:collect-prep',
        '-3:low-residue',
        '-2:low-residue',
        '-1:clear-only',
        '-1:dose-1',
        '-1:fluid-after-1',
      ],
    },
  ]
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

type PatientRow = {
  phone: string
  display_name: string
  language: string
  reader: string
}

type ProcedureRow = {
  scheduled_for: string
  arrive_at: string | null
  hospital: string
  location: string
  department_phone: string
}

const LANGUAGES = ['en', 'zh', 'ms', 'ta'] as const

/** Postgres hands back `08:30:00`; the plan and the letter both say `08:30`. */
function wallClock(time: string | null): string {
  return (time ?? '08:00').slice(0, 5)
}

/**
 * The patient as the department knows them.
 *
 * Two reads rather than a join, because they answer different questions and
 * fail differently: no patient row means "nothing is booked against this
 * number", which is a legitimate answer given to anyone who proves they hold
 * the phone. A patient row with no procedure means the same thing to the
 * reader, so both return null and the caller shows the empty plan.
 *
 * The four signals come back `UNMEASURED`. That is not a gap -- the portal
 * derives every one of them from what the patient recorded, and `livePatient`
 * below folds that in. The demo fixture carries pre-filled signals only because
 * it has nowhere else to put them.
 */
async function fromSupabase(phone: string): Promise<Patient | null> {
  const scope = patientScope(phone)

  const [patientResult, procedureResult] = await Promise.all([
    scope.select<PatientRow>('web_patients', 'phone, display_name, language, reader').maybeSingle(),
    scope
      .select<ProcedureRow>(
        'web_procedures',
        'scheduled_for, arrive_at, hospital, location, department_phone',
      )
      // The most recent booking, so a patient whose scope has passed keeps
      // reading "Afterwards" until the next one is entered.
      .order('scheduled_for', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // A read that failed is not the same as a patient who does not exist. Throw,
  // so Next.js shows the error boundary: a patient told "nothing is booked"
  // because the database was briefly unreachable would reasonably conclude
  // their appointment was cancelled, and not turn up.
  if (patientResult.error) {
    logDbError('web_patients', patientResult.error)
    throw new Error('Could not read the patient record.')
  }
  if (procedureResult.error) {
    logDbError('web_procedures', procedureResult.error)
    throw new Error('Could not read the procedure.')
  }

  const row = patientResult.data
  const procedure = procedureResult.data
  if (!row || !procedure) return null

  const language = (LANGUAGES as readonly string[]).includes(row.language)
    ? (row.language as Profile['language'])
    : 'en'

  return {
    phone: row.phone,
    profile: {
      displayName: row.display_name,
      language,
      reader: row.reader === 'caregiver' ? 'caregiver' : 'patient',
    },
    procedure: {
      date: procedure.scheduled_for,
      hospital: procedure.hospital,
      location: procedure.location,
      arriveAt: wallClock(procedure.arrive_at),
      departmentPhone: procedure.department_phone,
    },
    signals: {
      dietCompliance: UNMEASURED,
      prepTiming: UNMEASURED,
      fluidIntake: UNMEASURED,
      bowelOutput: UNMEASURED,
    },
    completed: [],
  }
}

// ---------------------------------------------------------------------------

export async function findPatient(phone: string, now = new Date()): Promise<Patient | null> {
  if (patientSource() === 'supabase') return fromSupabase(phone)
  return demoCohort(now).find((p) => p.phone === phone) ?? null
}

/** Every demo number, for the sign-in hint. Empty once a database is in play. */
export function demoNumbers(): { phone: string; name: string; where: string }[] {
  if (patientSource() === 'supabase') return []
  return demoCohort().map((p) => ({
    phone: p.phone,
    name: p.profile.displayName,
    where:
      p.procedure.date > dateFromToday(7)
        ? 'waiting'
        : 'in the run-up',
  }))
}

/**
 * The patient, with what they have actually recorded folded in.
 *
 * `findPatient` is the department's view -- what was prescribed, and whatever
 * the hospital already knows. `readProgress` is the patient's own record. This
 * merges them in one place so no screen has to remember to do it, and so the
 * tracker on `/doses` and the flag on `/progress` can never disagree.
 */
export type LivePatient = Patient & { readonly doseMl: Record<string, number> }

export async function livePatient(
  phone: string,
  progress: Progress,
  prepTiming: number | null,
): Promise<LivePatient | null> {
  const patient = await findPatient(phone)
  if (!patient) return null

  // Anything the patient recorded overrides the source: their own log is the
  // more recent fact. Anything they have not recorded keeps the source's value,
  // so an untouched signal stays UNMEASURED rather than becoming a zero.
  const reported = signalsFromInput({
    fluidGlasses: latestFluid(progress.fluidDays),
    stoolPoint: progress.stoolPoint,
    dietDays: progress.dietDays,
  })

  return {
    ...patient,
    doseMl: progress.doses,
    signals: {
      ...patient.signals,
      ...reported,
      ...(prepTiming === null ? {} : { prepTiming }),
    },
    completed: [...new Set([...patient.completed, ...progress.completed])],
  }
}
