import Link from 'next/link'
import { format, parseISO } from 'date-fns'

import { Wordmark } from '@/components/brand'
import { Card, Notice } from '@/components/ui'
import { PHASE_COPY, offsetFor, phaseFor } from '@/domain/prep'
import { listPatients, readAdmin, type AdminPatient } from '@/lib/admin'
import { formatPhone } from '@/lib/phone'
import { usingDatabase } from '@/lib/source'

import { AdminHeader, NoDatabase } from './AdminShell'
import { AdminSignInForm } from './SignInForm'

export const metadata = { title: 'Patients — Clarity admin' }

const DONE: Record<string, string> = {
  deleted: 'Patient deleted.',
}

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ done?: string }>
}) {
  if (!(await readAdmin())) return <SignIn />

  if (!usingDatabase()) {
    return (
      <>
        <AdminHeader title="Patients" />
        <NoDatabase />
      </>
    )
  }

  const [patients, { done }] = await Promise.all([listPatients(), searchParams])

  return (
    <>
      <AdminHeader title="Patients" />

      {done && DONE[done] ? (
        <div className="mb-5">
          <Notice>{DONE[done]}</Notice>
        </div>
      ) : null}

      <Link
        href="/admin/patients/new"
        className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-blue px-5 text-[17px] font-semibold text-white hover:bg-blue-deep"
      >
        Add a patient
      </Link>

      <Card className="mt-6 p-0">
        {patients.length === 0 ? (
          <p className="px-5 py-6 text-[17px] text-ink-muted">No patients yet.</p>
        ) : (
          <ul className="divide-y divide-hairline">
            {patients.map((patient) => (
              <PatientRow key={patient.phone} patient={patient} />
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-5 text-[15px] leading-relaxed text-ink-faint">
        A patient signs in with the number shown here. Their stage is worked out from the
        procedure date each day, so moving the date moves them through the prep.
      </p>
    </>
  )
}

function SignIn() {
  return (
    <div className="mx-auto max-w-[420px] pt-6">
      <Wordmark width={132} />
      <h1 className="mt-6 text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-ink">
        Clarity admin
      </h1>
      <p className="mb-7 mt-3 text-[17px] leading-relaxed text-ink-muted">
        For adding patients and setting their procedure dates.
      </p>
      <AdminSignInForm />
    </div>
  )
}

/** "in 3 days", "tomorrow", "2 days ago" -- `offset` counts up to the procedure. */
function relative(offset: number): string {
  if (offset === 0) return 'today'
  if (offset === -1) return 'tomorrow'
  if (offset === 1) return 'yesterday'
  return offset < 0 ? `in ${-offset} days` : `${offset} days ago`
}

function PatientRow({ patient }: { patient: AdminPatient }) {
  const { procedure } = patient
  const offset = procedure ? offsetFor(procedure.date) : null

  return (
    <li>
      <Link
        href={`/admin/patients/${patient.phone.slice(1)}`}
        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper-dim"
      >
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold text-ink">
            {patient.displayName || 'No name'}
          </div>
          <div className="text-[15px] text-ink-muted">
            <span className="font-mono">{formatPhone(patient.phone)}</span>
            {patient.reader === 'caregiver' ? ' · caregiver' : ''}
            {patient.recorded ? ' · has recorded progress' : ''}
          </div>
        </div>
        <div className="shrink-0 text-right">
          {procedure && offset !== null ? (
            <>
              <span className="inline-block rounded-full bg-blue-wash px-2.5 py-0.5 text-[13px] font-semibold text-blue-deep">
                {PHASE_COPY[phaseFor(offset)].name}
              </span>
              <div className="mt-1 text-[15px] text-ink-muted">
                <span className="font-mono">{format(parseISO(procedure.date), 'd MMM yyyy')}</span>
                {' · '}
                {relative(offset)}
              </div>
            </>
          ) : (
            <span className="text-[15px] text-ink-faint">Nothing booked</span>
          )}
        </div>
      </Link>
    </li>
  )
}
