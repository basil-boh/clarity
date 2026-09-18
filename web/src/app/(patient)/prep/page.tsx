import { format, parseISO } from 'date-fns'

import { Card, Notice, SectionTitle } from '@/components/ui'
import { CalendarExportButton } from '@/components/CalendarExportButton'
import { NoRecord } from '@/components/NoRecord'
import { StepList } from '@/components/StepList'
import { PHASE_COPY, buildPlan, offsetFor } from '@/domain/prep'
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
      <header className="mb-7">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          How to prep
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
          Every day of the run-up, in order. Today is marked.
        </p>
        <CalendarExportButton procedure={patient.procedure} plan={plan} />
      </header>

      <div className="mb-6">
        <Notice tone="alert">
          The second dose is the one most often skipped, and it is the one that clears the right
          side of the colon. Finish both.
        </Notice>
      </div>

      <div className="space-y-5">
        {plan
          .filter((day) => day.steps.length > 0)
          .map((day) => {
            const isToday = day.offset === offset
            return (
              <section key={day.offset}>
                <SectionTitle>
                  {format(parseISO(day.date), 'EEEE d MMMM')}
                  {isToday ? ' · Today' : ''}
                </SectionTitle>
                <Card className={isToday ? 'border-blue' : undefined}>
                  <h3 className="mb-1 text-[19px] font-semibold tracking-[-0.015em] text-ink">
                    {PHASE_COPY[day.phase].name}
                  </h3>
                  <p className="mb-4 text-[15px] leading-relaxed text-ink-muted">
                    {PHASE_COPY[day.phase].blurb}
                  </p>
                  <StepList steps={day.steps} completed={patient.completed} />
                </Card>
              </section>
            )
          })}
      </div>

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
