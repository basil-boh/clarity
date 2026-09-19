'use server'

import type { ReviewedMedication } from '@/domain/medications'
import { saveMedications } from '@/lib/medications-store'
import { livePatient } from '@/lib/patients'
import { prepTimingFrom, toggleStep } from '@/lib/progress'
import { requireSession } from '@/lib/session'

/**
 * Tick a step off, or back on. Shared by Today and the Plan, which both list
 * steps. Returns the patient's whole completed list -- through `livePatient`,
 * the same merge the pages render from -- so the screen shows what was saved.
 */
export async function tickStep(uid: string): Promise<readonly string[]> {
  const session = await requireSession()
  const progress = await toggleStep(uid)
  const patient = await livePatient(session.phone, progress, prepTimingFrom(progress.doses))
  return patient?.completed ?? progress.completed
}

/** Keep the medication instructions the patient has confirmed. False if it could not. */
export async function saveMedicationPlan(entries: ReviewedMedication[]): Promise<boolean> {
  await requireSession()
  return saveMedications(entries)
}
