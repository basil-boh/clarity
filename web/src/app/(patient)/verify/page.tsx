import { NoPatient } from '@/components/NoPatient'
import { StoolCheck } from '@/components/StoolCheck'
import { hasDepartmentPhone } from '@/domain/prep'
import { findPatient } from '@/lib/patients'
import { readProgress } from '@/lib/progress'
import { requireSession } from '@/lib/session'
import { saveStoolCheck } from '../actions'

export const metadata = { title: 'Stool check-in — Clarity' }

export default async function Verify() {
  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoPatient phone={session.phone} />
  const progress = await readProgress()
  return (
    <>
      <header className="mb-7">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">Stool check-in</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">Tell us what you noticed on your latest toilet trip. We will take it one question at a time.</p>
      </header>
      <StoolCheck saved={progress.stoolCheck ?? null} onSave={saveStoolCheck}
        departmentPhone={hasDepartmentPhone(patient.procedure) ? patient.procedure.departmentPhone : undefined} />
    </>
  )
}
