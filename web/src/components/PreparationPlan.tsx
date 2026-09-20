'use client'

import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PHASE_COPY, type PlanDay, type Procedure, type Step } from '@/domain/prep'
import { medicationIssues, medicationOccurrences, type ReviewedMedication } from '@/domain/medications'
import { CalendarExportButton } from './CalendarExportButton'
import { MedicationReview } from './MedicationReview'
import { Card, Notice, SectionTitle } from './ui'
import { StepList } from './StepList'

/** What is worth keeping: entries the patient confirmed that still check out. */
const keepable = (entries: readonly ReviewedMedication[], procedureDate: string) =>
  entries.filter(entry => entry.confirmed && !medicationIssues(entry, procedureDate).length)

export function PreparationPlan({ procedure, plan, offset, completed, onToggleStep, savedMedications = [], onSaveMedications }: {
  procedure: Procedure; plan: PlanDay[]; offset: number; completed: readonly string[]
  /** Saves a tick; see `StepList`. */
  onToggleStep?: (uid: string) => Promise<readonly string[]>
  /** Medication entries kept from an earlier visit. */
  savedMedications?: ReviewedMedication[]
  /** Keeps confirmed entries; absent where there is nowhere to keep them. */
  onSaveMedications?: (entries: ReviewedMedication[]) => Promise<boolean>
}) {
  const [entries, setEntries] = useState<ReviewedMedication[]>(savedMedications)
  const [saveFailed, setSaveFailed] = useState(false)
  const savedKey = useRef(JSON.stringify(keepable(savedMedications, procedure.date)))
  // Saves run one after another, so a slow one cannot land after a newer one.
  const saving = useRef<Promise<void>>(Promise.resolve())
  const medications = medicationOccurrences(entries, procedure.date)
  const persisted = Boolean(onSaveMedications) && !saveFailed

  // Save once the confirmed set settles, not on every keystroke of a review.
  useEffect(() => {
    if (!onSaveMedications) return
    const keep = keepable(entries, procedure.date)
    const key = JSON.stringify(keep)
    if (key === savedKey.current) return
    const timer = setTimeout(() => {
      saving.current = saving.current.then(async () => {
        try {
          const saved = await onSaveMedications(keep)
          if (saved) savedKey.current = key
          setSaveFailed(!saved)
        } catch {
          setSaveFailed(true)
        }
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [entries, procedure.date, onSaveMedications])
  // Today's steps and earlier ones can be ticked off; the days ahead are to read.
  const tickable = plan.filter(day => day.offset <= offset).flatMap(day => day.steps.map(step => step.uid))
  const dates = [...new Set([...plan.filter(day => day.steps.length).map(day => day.date), ...medications.map(m => m.date)])].sort()

  return <>
    <header className="mb-7">
      <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">How to prep</h1>
      <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">Every day of the run-up, in order. Today is marked.</p>
      <MedicationReview procedure={procedure} entries={entries} onChange={setEntries} persisted={persisted} />
      {saveFailed && <div className="mt-4"><Notice tone="alert">Your medication reminders could not be saved, so they last only until you leave this page. Download them to your calendar to keep them.</Notice></div>}
      <CalendarExportButton procedure={procedure} plan={plan} medications={medications} />
      {medications.length > 0 && <p className="mt-3 text-[14px] text-blue-deep">Includes {medications.length} medication reminders.{persisted ? '' : ' Download before leaving this page.'}</p>}
    </header>
    <div className="mb-6"><Notice tone="alert">The second dose is the one most often skipped, and it is the one that clears the right side of the colon. Finish both.</Notice></div>
    <div className="space-y-5">
      {dates.map(date => {
        const day = plan.find(d => d.date === date)
        const isToday = day?.offset === offset
        const added: Step[] = medications.filter(m => m.date === date).map(m => ({
          id: m.uid, uid: m.uid, kind: 'medicine', title: m.title, detail: m.description, at: m.time, weight: 'advised', date: m.date,
        }))
        // Ordered by the instant each step actually happens, not by its clock
        // face: the 2am second dose reads "02:00" but comes after the 18:00
        // first dose, and sorting on the time alone listed it above.
        const steps = [...day?.steps ?? [], ...added].sort((a, b) =>
          `${a.date} ${a.at ?? ''}`.localeCompare(`${b.date} ${b.at ?? ''}`))
        return <section key={date}>
          <SectionTitle>{format(parseISO(date), 'EEEE d MMMM')}{isToday ? ' · Today' : ''}</SectionTitle>
          <Card className={isToday ? 'border-blue' : undefined}>
            <h3 className="mb-1 text-[19px] font-semibold tracking-[-0.015em] text-ink">{day ? PHASE_COPY[day.phase].name : 'Your medication instructions'}</h3>
            <p className="mb-4 text-[15px] leading-relaxed text-ink-muted">{day ? PHASE_COPY[day.phase].blurb : 'From the department’s sheet you reviewed.'}</p>
            <StepList steps={steps} completed={completed} tickable={tickable} onToggle={onToggleStep} />
          </Card>
        </section>
      })}
    </div>
  </>
}
