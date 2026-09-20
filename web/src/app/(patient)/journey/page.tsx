import { Card, SectionTitle } from '@/components/ui'
import { NoPatient } from '@/components/NoPatient'
import { Timeline } from '@/components/Timeline'
import { PHASE_COPY, offsetFor, phaseFor } from '@/domain/prep'
import { findPatient } from '@/lib/patients'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Journey — Clarity' }

export default async function Journey() {
  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoPatient phone={session.phone} />

  const offset = offsetFor(patient.procedure.date)
  const here = phaseFor(offset)

  return (
    <>
      <header className="mb-7">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          Your journey
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
          Five stages from here to the procedure. You are in{' '}
          <strong className="font-semibold text-ink">{PHASE_COPY[here].name.toLowerCase()}</strong>.
        </p>
      </header>

      <SectionTitle>Stages</SectionTitle>
      <Card className="px-4 py-6">
        <Timeline here={here} procedureDate={patient.procedure.date} />
      </Card>

      <p className="mt-7 text-[15px] leading-relaxed text-ink-faint">
        All of this happens outside the hospital, which is exactly why it usually goes unnoticed.
      </p>
    </>
  )
}
