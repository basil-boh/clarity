import { getI18n } from '@/lib/i18n-server'
import { Card, Notice, SectionTitle } from '@/components/ui'
import { NoPatient } from '@/components/NoPatient'
import { DoseTracker } from '@/components/DoseTracker'
import { dosesFor, hasDepartmentPhone } from '@/domain/prep'
import { findPatient } from '@/lib/patients'
import { readProgress, recordDose } from '@/lib/progress'
import { requireSession } from '@/lib/session'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('The preparation — Colonaid') }
}

/**
 * The purge night, and the only screen where the patient writes something that
 * changes the flag the ward reads in the morning.
 */
export default async function Doses() {
  const { tx } = await getI18n()

  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoPatient phone={session.phone} />

  const progress = await readProgress()

  async function record(doseId: string, ml: number): Promise<number> {
    'use server'
    const next = await recordDose(doseId, ml)
    return next.doses[doseId] ?? 0
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{tx("The preparation")}</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{tx("Record each glass as you finish it. This is what tells the nurse how your prep went.")}</p>
      </header>

      <div className="mb-6">
        <Notice tone="alert">{tx("Finishing the full volume is what decides whether the scope works. If you cannot keep it down, call your hospital/clinic — do not take extra to make up for it.")}</Notice>
      </div>

      <SectionTitle>{tx("Tonight’s doses")}</SectionTitle>
      <Card className="space-y-6">
        {dosesFor().map((dose) => (
          <DoseTracker
            key={dose.id}
            dose={dose}
            consumedMl={progress.doses[dose.id] ?? 0}
            onRecord={record}
          />
        ))}
      </Card>

      {hasDepartmentPhone(patient.procedure) ? (
        <a
          href={`tel:${patient.procedure.departmentPhone}`}
          className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[17px] font-semibold text-ink"
        >{tx("Call the hospital/clinic")}</a>
      ) : null}
    </>
  )
}
