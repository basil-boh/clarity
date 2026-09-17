import { Card, Notice, SectionTitle } from '@/components/ui'
import { NoRecord } from '@/components/NoRecord'
import { DoseTracker } from '@/components/DoseTracker'
import { dosesFor } from '@/domain/prep'
import { NEVER } from '@/domain/progress'
import { findPatient } from '@/lib/patients'
import { readProgress, recordDose } from '@/lib/progress'
import { readSession } from '@/lib/session'

export const metadata = { title: 'The preparation — Clarity' }

/**
 * The purge night, and the only screen where the patient writes something that
 * changes the flag the ward reads in the morning.
 */
export default async function Doses() {
  const session = (await readSession())!
  const patient = await findPatient(session.phone)
  if (!patient) return <NoRecord phone={session.phone} />

  const progress = await readProgress()

  async function record(doseId: string, ml: number): Promise<number> {
    'use server'
    const next = await recordDose(doseId, ml)
    return next.doses[doseId] ?? 0
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          The preparation
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
          Record each glass as you finish it. This is what tells the nurse how your prep went.
        </p>
      </header>

      <div className="mb-6">
        <Notice tone="alert">
          Finishing the full volume is what decides whether the scope works. If you cannot keep it
          down, call your department — do not take extra to make up for it.
        </Notice>
      </div>

      <SectionTitle>Tonight&rsquo;s doses</SectionTitle>
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

      <section className="mt-7">
        <SectionTitle>What this app will never do</SectionTitle>
        <Card>
          <ul className="space-y-4">
            {NEVER.map((rule) => (
              <li key={rule.id}>
                <p className="text-[17px] font-semibold leading-snug text-ink">{rule.rule}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{rule.because}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <a
        href={`tel:${patient.procedure.departmentPhone}`}
        className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[17px] font-semibold text-ink"
      >
        Call the department
      </a>
    </>
  )
}
