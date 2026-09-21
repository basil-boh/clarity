import Link from 'next/link'
import { ReadinessSummary } from '@/components/ReadinessSummary'
import { dietRating, prepRating, stoolRating, PREP_REPORTS, type PrepReport } from '@/domain/readiness'
import { SaveForm } from './SaveForm'
import { revalidatePath } from 'next/cache'

import { Card, SectionTitle } from '@/components/ui'
import { NoPatient } from '@/components/NoPatient'
import { StoolCheck } from '@/components/StoolCheck'
import { saveStoolCheck } from '../actions'
import { dosesFor, offsetFor, hasDepartmentPhone, todayIn } from '@/domain/prep'
import { DIET_ANSWERS, type DietAnswer } from '@/domain/progress'
import { findPatient } from '@/lib/patients'
import { readProgress, recordDietDay, toggleStep, writeProgress } from '@/lib/progress'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Readiness — Clarity' }
const DIET_OFFSETS = [-3, -2, -1]
const actionStyle = 'inline-flex min-h-[48px] items-center justify-center rounded-lg border px-3 py-2 text-[15px] font-semibold'

export default async function Readiness() {
  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoPatient phone={session.phone} />
  const progress = await readProgress()
  const offset = offsetFor(patient.procedure.date)
  const doses = dosesFor()
  const dietRecorded = DIET_OFFSETS.filter(day => progress.dietDays[String(day)]).length
  const dietKept = DIET_OFFSETS.filter(day => progress.dietDays[String(day)] === 'yes').length
  const timingConfirmed = doses.filter(dose => progress.completed.includes(`-1:timing-${dose.id}`)).length

  const prepReport = (['incomplete', 'completing', 'late'] as const).find(value => progress.completed.includes(`-1:readiness-${value}`)) ?? 'records'
  const morningCheck = !!progress.stoolCheck?.recordedAt &&
    progress.stoolCheck.procedureDate === patient.procedure.date &&
    todayIn(new Date(progress.stoolCheck.recordedAt)) === todayIn(new Date(patient.procedure.date))

  async function savePrepReport(form: FormData) {
    'use server'
    const { phone } = await requireSession()
    const currentPatient = await findPatient(phone)
    const value = form.get('report')
    if (!currentPatient || offsetFor(currentPatient.procedure.date) < -1 || typeof value !== 'string' || !Object.hasOwn(PREP_REPORTS, value)) throw new Error('Choose a valid preparation status.')
    const current = await readProgress()
    const completed = current.completed.filter(uid => !['-1:readiness-incomplete', '-1:readiness-completing', '-1:readiness-late'].includes(uid))
    if (value !== 'records') completed.push(`-1:readiness-${value}`)
    await writeProgress({ ...current, completed })
    revalidatePath('/readiness')
  }

  async function saveDiet(form: FormData) {
    'use server'
    const { phone } = await requireSession()
    const currentPatient = await findPatient(phone)
    const day = Number(form.get('day'))
    const answer = form.get('answer')
    if (!currentPatient || !DIET_OFFSETS.includes(day) || day > offsetFor(currentPatient.procedure.date) ||
      !DIET_ANSWERS.some(option => option.id === answer)) throw new Error('Please choose a valid diet day and answer.')
    await recordDietDay(day, answer as DietAnswer)
    revalidatePath('/readiness')
  }

  async function confirmTiming(form: FormData) {
    'use server'
    const { phone } = await requireSession()
    const currentPatient = await findPatient(phone)
    const id = String(form.get('dose'))
    if (!currentPatient || !dosesFor().some(dose => dose.id === id) || offsetFor(currentPatient.procedure.date) < (id === 'dose-2' ? 0 : -1)) {
      throw new Error('This dose is not due yet.')
    }
    // Keep timing self-reports separate from the plan’s dose-completion ticks.
    // The existing completed-step store persists these in demo and database modes.
    const uid = `-1:timing-${id}`
    const current = await readProgress()
    const confirmed = form.get('confirmed') === 'yes'
    if (current.completed.includes(uid) !== confirmed) await toggleStep(uid)
    revalidatePath('/readiness')
  }

  return (
    <>
      <header className="mb-7">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">Readiness</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">A little check-in, one step at a time. See what you have recorded and what comes next.</p>
      </header>
      <div className="space-y-6">
        <Card>
          <SectionTitle>01 · Low-residue diet</SectionTitle>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ink">
            {dietRecorded === 0 ? 'How have your meals been?' : dietKept === 3 ? 'Diet followed on all three days' : `${dietRecorded} of 3 days checked in`}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">Record how each day went. It is okay if things did not go exactly to plan.</p>
          <div className="mt-5 space-y-5">
            {DIET_OFFSETS.map(day => {
              const answer = progress.dietDays[String(day)]
              const future = day > offset
              return (
                <SaveForm key={day} action={saveDiet}>
                  <input type="hidden" name="day" value={day} />
                  <fieldset disabled={future}>
                    <legend className="mb-2 text-[16px] font-semibold text-ink">{Math.abs(day)} {day === -1 ? 'day' : 'days'} before · {future ? 'Upcoming' : answer ? DIET_ANSWERS.find(a => a.id === answer)?.label : 'Not recorded'}</legend>
                    <div className="grid grid-cols-3 gap-2">
                      {DIET_ANSWERS.map(option => (
                        <button key={option.id} name="answer" value={option.id} aria-pressed={answer === option.id}
                          className={`${actionStyle} disabled:opacity-45 ${answer === option.id ? 'border-blue bg-blue text-white' : 'border-hairline-strong text-ink hover:bg-paper-sunken'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </SaveForm>
              )
            })}
          </div>
          <Link href="/diet" className="mt-5 inline-flex min-h-[44px] items-center font-semibold text-blue">View my meal list →</Link>
        </Card>

        <Card>
          <SectionTitle>02 · Purgative schedule</SectionTitle>
          <h2 className="text-[22px] font-bold tracking-[-0.02em] text-ink">{timingConfirmed === doses.length ? 'Schedule confirmed by you' : `${timingConfirmed} of ${doses.length} doses confirmed on time`}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">Check against your department’s instructions. Recorded volume and timing are separate — only confirm a dose after taking it.</p>
          <div className="mt-5 space-y-5">
            {doses.map(dose => {
              const confirmed = progress.completed.includes(`-1:timing-${dose.id}`)
              return (
                <div key={dose.id} className="border-t border-hairline pt-4">
                  <h3 className="text-[17px] font-semibold text-ink">{dose.label} · {dose.at}</h3>
                  <p className="mt-1 text-[15px] text-ink-muted">{dose.id === 'dose-1' ? 'Evening before' : 'Procedure morning'} · {progress.doses[dose.id] ?? 0} / {dose.volumeMl} ml recorded</p>
                  <SaveForm action={confirmTiming} className="mt-3">
                    <input type="hidden" name="dose" value={dose.id} />
                    <input type="hidden" name="confirmed" value={confirmed ? 'no' : 'yes'} />
                    <button disabled={offset < (dose.id === 'dose-2' ? 0 : -1)} aria-pressed={confirmed}
                      className={`${actionStyle} w-full disabled:opacity-45 ${confirmed ? 'border-blue bg-blue-wash text-blue' : 'border-hairline-strong text-ink'}`}>
                      {confirmed ? '✓ Taken on time · Undo' : 'I took this dose on time'}
                    </button>
                  </SaveForm>
                </div>
              )
            })}
          </div>
          <SaveForm action={savePrepReport} className="mt-5">
            <fieldset disabled={offset < -1}>
              <legend className="mb-2 text-[16px] font-semibold text-ink">Anything different from your dose records?</legend>
              <p className="mb-3 text-[14px] text-ink-muted">Choose your current status. Update it when things change; this report takes priority over the dose log.</p>
              <div className="space-y-2">
                {(Object.entries(PREP_REPORTS) as [PrepReport, string][]).map(([value, label]) => (
                  <button key={value} name="report" value={value} aria-pressed={prepReport === value}
                    className={`${actionStyle} w-full justify-start text-left disabled:opacity-45 ${prepReport === value ? 'border-blue bg-blue-wash text-blue' : 'border-hairline-strong text-ink'}`}>{label}</button>
                ))}
              </div>
            </fieldset>
          </SaveForm>
          <Link href="/doses" className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-blue">Record my glasses →</Link>
          <p className="text-[14px] leading-relaxed text-ink-faint">Missed a dose or unsure about timing? Contact your department. Do not take extra preparation.</p>
        </Card>

        <section aria-labelledby="stool-heading">
          <SectionTitle>03 · Stool check-in</SectionTitle>
          <h2 id="stool-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink">Let’s check your latest output</h2>
          <p className="mb-4 mt-2 text-[15px] leading-relaxed text-ink-muted">A few short questions about what you see. No photo needed.</p>
          <StoolCheck saved={progress.stoolCheck ?? null} onSave={saveStoolCheck}
            departmentPhone={hasDepartmentPhone(patient.procedure) ? patient.procedure.departmentPhone : undefined} />
        </section>
        <Card>
          <h2 className="text-[17px] font-semibold text-ink">Your team makes the final call</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">These check-ins help you share your progress. Colour or frequent toilet trips alone cannot confirm readiness for your colonoscopy.</p>
          <Link href="/ask" className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-blue">Ask a question →</Link>
          {hasDepartmentPhone(patient.procedure) ? <a href={`tel:${patient.procedure.departmentPhone}`} className="mt-2 flex min-h-[48px] items-center justify-center rounded-lg border border-hairline-strong font-semibold text-ink">Call the department</a> : null}
        </Card>
        <ReadinessSummary diet={dietRating(progress.dietDays)}
          prep={prepRating(doses, progress.doses, progress.completed)}
          stool={stoolRating(progress.stoolCheck, morningCheck)}
          concerning={progress.stoolCheck?.colour === 'dark' || progress.stoolCheck?.colour === 'red'}
          phone={hasDepartmentPhone(patient.procedure) ? patient.procedure.departmentPhone : undefined} />
      </div>
    </>
  )
}
