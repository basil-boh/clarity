import { getI18n } from '@/lib/i18n-server'
import { Card } from '@/components/ui'
import { PreparationPlan } from '@/components/PreparationPlan'
import { NoPatient } from '@/components/NoPatient'
import { buildPlan, offsetFor, hasDepartmentPhone } from '@/domain/prep'
import { loadMedications } from '@/lib/medications-store'
import { livePatient } from '@/lib/patients'
import { readProgress, prepTimingFrom, usingDatabase } from '@/lib/progress'
import { requireSession } from '@/lib/session'

import { saveMedicationPlan, tickStep } from '../actions'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('How to prep — Colonaid') }
}

/**
 * The whole run-up, day by day.
 *
 * This is the page that replaces the sheet of paper, so it is deliberately the
 * long one: everything the patient was handed at the consultation, in order,
 * with today marked. Nothing is collapsed behind a tap.
 */
export default async function Prep() {
  const { tx } = await getI18n()

  const session = await requireSession()
  const [progress, medications] = await Promise.all([readProgress(), loadMedications()])
  const patient = await livePatient(
    session.phone,
    progress,
    prepTimingFrom(progress.doses),
  )
  if (!patient) return <NoPatient phone={session.phone} />

  const offset = offsetFor(patient.procedure.date)
  const plan = buildPlan(patient.procedure.date)

  return (
    <>
      <PreparationPlan
        key={patient.procedure.date}
        procedure={patient.procedure}
        plan={plan}
        offset={offset}
        completed={patient.completed}
        onToggleStep={tickStep}
        savedMedications={medications}
        // Only where there is a database to keep them in; see medications-store.
        onSaveMedications={usingDatabase() ? saveMedicationPlan : undefined}
      />

      <section className="mt-8">
        <Card>
          <h3 className="text-[17px] font-semibold text-ink">{tx("Not sure about something?")}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{tx("Guidance differs between hospitals. When in doubt, your hospital/clinic’s answer is the one that applies to you.")}</p>
          {hasDepartmentPhone(patient.procedure) ? (
            <a
              href={`tel:${patient.procedure.departmentPhone}`}
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-blue px-4 text-[16px] font-semibold text-white"
            >{tx("Call the hospital/clinic")}</a>
          ) : null}
        </Card>
      </section>
    </>
  )
}
