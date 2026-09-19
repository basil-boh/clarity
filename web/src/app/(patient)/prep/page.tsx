import { Card, SectionTitle } from '@/components/ui'
import { PreparationPlan } from '@/components/PreparationPlan'
import { NoRecord } from '@/components/NoRecord'
import { buildPlan, offsetFor } from '@/domain/prep'
import { NEVER } from '@/domain/progress'
import { livePatient } from '@/lib/patients'
import { readProgress, prepTimingFrom } from '@/lib/progress'
import { readSession } from '@/lib/session'

export const metadata = { title: 'How to prep — Clarity' }

/**
 * The whole run-up, day by day.
 *
 * This is the page that replaces the sheet of paper, so it is deliberately the
 * long one: everything the patient was handed at the consultation, in order,
 * with today marked. Nothing is collapsed behind a tap.
 */
export default async function Prep() {
  const session = (await readSession())!
  const progress = await readProgress()
  const patient = await livePatient(
    session.phone,
    progress,
    prepTimingFrom(progress.doses),
  )
  if (!patient) return <NoRecord phone={session.phone} />

  const offset = offsetFor(patient.procedure.date)
  const plan = buildPlan(patient.procedure.date)

  return (
    <>
      <PreparationPlan key={patient.procedure.date} procedure={patient.procedure} plan={plan} offset={offset} completed={patient.completed} />

      <section className="mt-8">
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

      <section className="mt-6">
        <Card>
          <h3 className="text-[17px] font-semibold text-ink">Not sure about something?</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
            Guidance differs between hospitals. When in doubt, your department&rsquo;s answer is
            the one that applies to you.
          </p>
          <a
            href={`tel:${patient.procedure.departmentPhone}`}
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-blue px-4 text-[16px] font-semibold text-white"
          >
            Call the department
          </a>
        </Card>
      </section>
    </>
  )
}
