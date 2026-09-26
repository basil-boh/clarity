'use client'

import { useI18n } from '@/components/I18nProvider'

import { parseISO } from 'date-fns'
import { PHASE_COPY, type PlanDay } from '@/domain/prep'
import { Card, Notice, SectionTitle } from './ui'
import { StepList } from './StepList'

/**
 * The run-up from today on. `plan` is expected to be `upcomingPlan`'s output,
 * so days already done are not here: a patient reads what is coming, not a
 * record of what has passed.
 */
export function PreparationPlan({ plan, offset, completed, onToggleStep }: {
  plan: PlanDay[]; offset: number; completed: readonly string[]
  /** Saves a tick; see `StepList`. */
  onToggleStep?: (uid: string) => Promise<readonly string[]>
}) {
  const { tx, dateFormat } = useI18n()

  // Today's steps and earlier ones can be ticked off; the days ahead are to read.
  const tickable = plan.filter(day => day.offset <= offset).flatMap(day => day.steps.map(step => step.uid))
  const days = plan.filter(day => day.steps.length > 0)
  const purgeAhead = days.some(day => day.steps.some(step => step.kind === 'purgative'))

  return <>
    <header className="mb-7">
      <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{tx("How to prep")}</h1>
      <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{tx("What is coming up, from today. Days already done are hidden.")}</p>
    </header>
    {purgeAhead ? <div className="mb-6"><Notice tone="alert">{tx("The second dose of purgative is the one most often skipped, and it is the one that clears the right side of the colon. Finish both.")}</Notice></div> : null}
    {days.length === 0 ? <Card><p className="text-[16px] leading-relaxed text-ink-muted">{tx("Nothing left to do in your preparation plan.")}</p></Card> : null}
    <div className="space-y-5">
      {days.map(day => {
        const isToday = day.offset === offset
        // Ordered by the instant each step actually happens, not by its clock
        // face: the 2am second dose reads "02:00" but comes after the 18:00
        // first dose, and sorting on the time alone listed it above.
        const steps = [...day.steps].sort((a, b) =>
          `${a.date} ${a.at ?? ''}`.localeCompare(`${b.date} ${b.at ?? ''}`))
        return <section key={day.date}>
          <SectionTitle>{tx(dateFormat(parseISO(day.date), 'EEEE d MMMM'))}{tx(isToday ? ' · Today' : '')}</SectionTitle>
          <Card className={isToday || day.offset < offset ? 'border-blue' : undefined}>
            <h3 className="mb-1 text-[19px] font-semibold tracking-[-0.015em] text-ink">{tx(PHASE_COPY[day.phase].name)}</h3>
            <p className="mb-4 text-[15px] leading-relaxed text-ink-muted">{tx(PHASE_COPY[day.phase].blurb)}</p>
            <StepList steps={steps} completed={completed} tickable={tickable} onToggle={onToggleStep} />
          </Card>
        </section>
      })}
    </div>
  </>
}
