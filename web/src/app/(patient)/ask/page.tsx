import { getI18n } from '@/lib/i18n-server'
import { NoPatient } from '@/components/NoPatient'
import { findPatient } from '@/lib/patients'
import { requireSession } from '@/lib/session'

import { AskChat } from './AskChat'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Ask — Colonaid') }
}

export default async function Ask() {
  const { tx } = await getI18n()

  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoPatient phone={session.phone} />

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{tx("Ask")}</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{tx("For the hours when the hospital/clinic is closed and the sheet does not cover it.")}</p>
      </header>

      <AskChat departmentPhone={patient.procedure.departmentPhone} />
    </>
  )
}
