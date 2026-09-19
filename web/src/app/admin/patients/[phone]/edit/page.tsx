import { notFound } from 'next/navigation'

import { Notice } from '@/components/ui'
import { getPatient, requireAdmin } from '@/lib/admin'
import { formatPhone } from '@/lib/phone'
import { usingDatabase } from '@/lib/source'

import { removePatient } from '../../../actions'
import { AdminHeader, NoDatabase } from '../../../AdminShell'
import { PatientForm } from '../../../PatientForm'

export const metadata = { title: 'Edit patient — Clarity admin' }

export default async function EditPatient({ params }: { params: Promise<{ phone: string }> }) {
  await requireAdmin()

  if (!usingDatabase()) {
    return (
      <>
        <AdminHeader title="Edit patient" />
        <NoDatabase />
      </>
    )
  }

  const { phone: digits } = await params
  if (!/^\d{8,15}$/.test(digits)) notFound()
  const patient = await getPatient(`+${digits}`)
  if (!patient) notFound()

  const { procedure } = patient
  const name = patient.displayName || formatPhone(patient.phone)

  return (
    <>
      <AdminHeader
        title={`Edit ${name}`}
        back={{ href: `/admin/patients/${digits}`, label: `Back to ${name}` }}
      />

      {procedure ? null : (
        <div className="mb-6">
          <Notice tone="alert">
            Nothing is booked yet, so this patient sees &ldquo;Nothing booked under this
            number&rdquo;. Save below to add their procedure.
          </Notice>
        </div>
      )}

      <PatientForm
        mode="update"
        initial={{
          phone: patient.phone,
          displayName: patient.displayName,
          reader: patient.reader,
          date: procedure?.date ?? '',
          arriveAt: procedure?.arriveAt ?? '08:30',
          hospital: procedure?.hospital ?? '',
          location: procedure?.location ?? '',
          departmentPhone: procedure ? formatPhone(procedure.departmentPhone) : '',
        }}
      />

      {/* Two steps rather than a confirm() dialog: open, then press. */}
      <details className="mt-10 rounded-xl border border-hairline bg-paper p-5">
        <summary className="cursor-pointer text-[17px] font-semibold text-alert">
          Delete this patient
        </summary>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">
          Removes {name}, their procedure and everything they recorded. Signing in with{' '}
          <span className="font-mono">{formatPhone(patient.phone)}</span> will then show
          &ldquo;Nothing booked&rdquo;.
        </p>
        <form action={removePatient} className="mt-4">
          <input type="hidden" name="phone" value={patient.phone} />
          <button
            type="submit"
            className="inline-flex min-h-[48px] items-center rounded-lg border border-alert/40 bg-alert-tint px-5 text-[16px] font-semibold text-alert hover:border-alert"
          >
            Delete {name}
          </button>
        </form>
      </details>
    </>
  )
}
