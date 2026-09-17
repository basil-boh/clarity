import 'server-only'

import { addDays, format } from 'date-fns'

import type { Procedure, Profile } from '@/domain/prep'
import type { Progress } from '@/lib/progress'
import { UNMEASURED, signalsFromInput, type Signals } from '@/domain/progress'

/**
 * Where a patient record comes from.
 *
 * One module, one function -- `findPatient(phone)` -- so that swapping the demo
 * dataset for the hospital's own system is a change in this file and nowhere
 * else. The screens never reach for a database.
 *
 * Today it answers from a fixture keyed by phone number, which is what lets the
 * whole flow be demonstrated end to end without a Supabase project or a
 * hospital integration. `PATIENT_SOURCE=supabase` is where the real lookup goes.
 */

export type Patient = {
  readonly phone: string
  readonly profile: Profile
  readonly procedure: Procedure
  readonly signals: Signals
  /** Step uids (`offset:id`) the patient has ticked off. */
  readonly completed: readonly string[]
}

/**
 * The demo cohort.
 *
 * Three patients at three points in the run-up, because the interesting bugs in
 * a date-derived plan only show up at the boundaries. Dates are relative to
 * today so the fixture never goes stale.
 */
function demoCohort(today = new Date()): Patient[] {
  const iso = (days: number) => format(addDays(today, days), 'yyyy-MM-dd')

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

export async function findPatient(phone: string, today = new Date()): Promise<Patient | null> {
  if (process.env.PATIENT_SOURCE === 'supabase') {
    // The hospital lookup goes here. Deliberately not stubbed with something
    // that half-works: an unconfigured source should fail loudly, not quietly
    // hand back an empty patient.
    throw new Error('PATIENT_SOURCE=supabase is not wired up yet.')
  }
  return demoCohort(today).find((p) => p.phone === phone) ?? null
}

/** Every demo number, for the sign-in hint. Never exported to a real build. */
export function demoNumbers(): { phone: string; name: string; where: string }[] {
  if (process.env.PATIENT_SOURCE === 'supabase') return []
  return demoCohort().map((p) => ({
    phone: p.phone,
    name: p.profile.displayName,
    where:
      p.procedure.date > format(addDays(new Date(), 7), 'yyyy-MM-dd')
        ? 'waiting'
        : 'in the run-up',
  }))
}

/**
 * The patient, with what they have actually recorded folded in.
 *
 * The fixture is the department's view -- what was prescribed, and whatever the
 * hospital already knows. `readProgress` is the patient's own record. This
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

  // Anything the patient recorded overrides the fixture: their own log is the
  // more recent fact. Anything they have not recorded keeps the fixture's value,
  // so an untouched signal stays UNMEASURED rather than becoming a zero.
  const reported = signalsFromInput({
    fluidGlasses: progress.fluidGlasses,
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
