import { getI18n } from '@/lib/i18n-server'
import { PreparationPlan } from '@/components/PreparationPlan'
import { NoPatient } from '@/components/NoPatient'
import { buildPlan, offsetFor, upcomingPlan } from '@/domain/prep'
import { livePatient } from '@/lib/patients'
import { readProgress, prepTimingFrom } from '@/lib/progress'
import { requireSession } from '@/lib/session'

import { tickStep } from '../actions'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('How to prep — Colonaid') }
}

/**
 * The run-up, day by day, from today on.
 *
 * This is the page that replaces the sheet of paper, but only the part still
 * ahead: days already done are dropped (see `upcomingPlan`), because a patient
 * mid-prep reading past steps was being given more than they could use.
 */
export default async function Prep() {
  const session = await requireSession()
  const progress = await readProgress()
  const patient = await livePatient(
    session.phone,
    progress,
    prepTimingFrom(progress.doses),
  )
  if (!patient) return <NoPatient phone={session.phone} />

  const offset = offsetFor(patient.procedure.date)
  const plan = upcomingPlan(buildPlan(patient.procedure.date))

  return (
    <PreparationPlan
      key={patient.procedure.date}
      plan={plan}
      offset={offset}
      completed={patient.completed}
      onToggleStep={tickStep}
    />
  )
}
