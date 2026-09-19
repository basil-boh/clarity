'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PHASE_COPY, type PlanDay, type Procedure, type Step } from '@/domain/prep'
import { medicationOccurrences, type ReviewedMedication } from '@/domain/medications'
import { CalendarExportButton } from './CalendarExportButton'
import { MedicationReview } from './MedicationReview'
import { Card, Notice, SectionTitle } from './ui'
import { StepList } from './StepList'

export function PreparationPlan({ procedure, plan, offset, completed }: {
  procedure: Procedure; plan: PlanDay[]; offset: number; completed: readonly string[]
}) {
  const [entries, setEntries] = useState<ReviewedMedication[]>([])
  const medications = medicationOccurrences(entries, procedure.date)
  const dates = [...new Set([...plan.filter(day => day.steps.length).map(day => day.date), ...medications.map(m => m.date)])].sort()

  return <>
    <header className="mb-7">
      <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">How to prep</h1>
      <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">Every day of the run-up, in order. Today is marked.</p>
      <MedicationReview procedure={procedure} entries={entries} onChange={setEntries} />
      <CalendarExportButton procedure={procedure} plan={plan} medications={medications} />
      {medications.length > 0 && <p className="mt-3 text-[14px] text-blue-deep">Includes {medications.length} medication reminders. Download before leaving this page.</p>}
    </header>
    <div className="mb-6"><Notice tone="alert">The second dose is the one most often skipped, and it is the one that clears the right side of the colon. Finish both.</Notice></div>
    <div className="space-y-5">
      {dates.map(date => {
        const day = plan.find(d => d.date === date)
        const isToday = day?.offset === offset
        const added: Step[] = medications.filter(m => m.date === date).map(m => ({
          id: m.uid, uid: m.uid, kind: 'medicine', title: m.title, detail: m.description, at: m.time, weight: 'advised',
        }))
        const steps = [...day?.steps ?? [], ...added].sort((a, b) => (a.at ?? '').localeCompare(b.at ?? ''))
        return <section key={date}>
          <SectionTitle>{format(parseISO(date), 'EEEE d MMMM')}{isToday ? ' · Today' : ''}</SectionTitle>
          <Card className={isToday ? 'border-blue' : undefined}>
            <h3 className="mb-1 text-[19px] font-semibold tracking-[-0.015em] text-ink">{day ? PHASE_COPY[day.phase].name : 'Your medication instructions'}</h3>
            <p className="mb-4 text-[15px] leading-relaxed text-ink-muted">{day ? PHASE_COPY[day.phase].blurb : 'From the department’s sheet you reviewed.'}</p>
            <StepList steps={steps} completed={completed} />
          </Card>
        </section>
      })}
    </div>
  </>
}
