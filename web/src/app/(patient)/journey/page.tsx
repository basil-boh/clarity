import { getI18n } from '@/lib/i18n-server'
import { Card, SectionTitle } from '@/components/ui'
import { NoPatient } from '@/components/NoPatient'
import { Timeline } from '@/components/Timeline'
import { PHASE_COPY, offsetFor, phaseFor } from '@/domain/prep'
import { findPatient } from '@/lib/patients'
import { requireSession } from '@/lib/session'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Journey — Colonaid') }
}

export default async function Journey() {
  const { tx } = await getI18n()

  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoPatient phone={session.phone} />

  const offset = offsetFor(patient.procedure.date)
  const here = phaseFor(offset)

  return (
    <>
      <header className="mb-7">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{tx("Your journey")}</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{tx("Five stages from here to the procedure. You are in")}{tx(' ')}
          <strong className="font-semibold text-ink">{tx(PHASE_COPY[here].name)}</strong>.
        </p>
      </header>

      <SectionTitle>{tx("Stages")}</SectionTitle>
      <Card className="px-4 py-6">
        <Timeline here={here} procedureDate={patient.procedure.date} />
      </Card>

      <p className="mt-7 text-[15px] leading-relaxed text-ink-faint">{tx("All of this happens outside the hospital, which is exactly why it usually goes unnoticed.")}</p>
    </>
  )
}
