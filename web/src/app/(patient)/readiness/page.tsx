import Link from 'next/link'
import { SaveForm } from './SaveForm'
import { revalidatePath } from 'next/cache'

import { Card, SectionTitle } from '@/components/ui'
import { NoPatient } from '@/components/NoPatient'
import { StoolPhotoCheck } from '@/components/StoolPhotoCheck'
import { dosesFor, offsetFor, hasDepartmentPhone } from '@/domain/prep'
import { BOWEL_SCALE, DIET_ANSWERS, type DietAnswer, type BowelScalePoint } from '@/domain/progress'
import { findPatient } from '@/lib/patients'
import { readProgress, recordDietDay, recordStool, toggleStep } from '@/lib/progress'
import { requireSession } from '@/lib/session'
import { acceptVerification } from '@/lib/verification-store'

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

  async function acceptReading(id: string, point: BowelScalePoint) {
    'use server'
    const { phone } = await requireSession()
    if (![1, 2, 3, 4, 5].includes(point)) throw new Error('Choose a point on the scale.')
    if (id && !(await acceptVerification(phone, id, point))) throw new Error('The reading could not be saved. Please try again.')
    await recordStool(point)
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
          <Link href="/doses" className="mt-4 inline-flex min-h-[44px] items-center font-semibold text-blue">Record my glasses →</Link>
          <p className="text-[14px] leading-relaxed text-ink-faint">Missed a dose or unsure about timing? Contact your department. Do not take extra preparation.</p>
        </Card>

        <section aria-labelledby="stool-heading">
          <SectionTitle>03 · Stool photo check</SectionTitle>
          <h2 id="stool-heading" className="text-[22px] font-bold tracking-[-0.02em] text-ink">See how things are progressing</h2>
          <p className="mb-4 mt-2 text-[15px] leading-relaxed text-ink-muted">Upload a clear photo of the bowl once your preparation has started working. Review the suggested reading before saving it.</p>
          {progress.stoolPoint ? <p className="mb-4 text-[15px] font-semibold text-blue">Last recorded: {progress.stoolPoint} · {BOWEL_SCALE[progress.stoolPoint].label}</p> : null}
          <StoolPhotoCheck onAccept={acceptReading} />
          <Card className="mt-4">
            <h3 className="font-semibold text-ink">Or choose what you see</h3>
            <p className="mt-1 text-[15px] text-ink-muted">You can record a check without a photo.</p>
            <div className="mt-3 space-y-2">
              {([1, 2, 3, 4, 5] as BowelScalePoint[]).map(point => (
                <SaveForm key={point} action={async () => { 'use server'; await acceptReading('', point) }}>
                  <button aria-pressed={progress.stoolPoint === point} className={`${actionStyle} w-full justify-start gap-3 ${progress.stoolPoint === point ? 'border-blue bg-blue-wash text-blue' : 'border-hairline text-ink'}`}>
                    <span aria-hidden className="h-6 w-6 rounded-full" style={{ background: BOWEL_SCALE[point].swatch }} />{point} · {BOWEL_SCALE[point].label}
                  </button>
                </SaveForm>
              ))}
            </div>
          </Card>
        </section>
        <Card>
          <h2 className="text-[17px] font-semibold text-ink">Your team makes the final call</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">These check-ins help you share your progress. A photo cannot confirm whether you are ready for your colonoscopy.</p>
          <Link href="/ask" className="mt-3 inline-flex min-h-[44px] items-center font-semibold text-blue">Ask a question →</Link>
          {hasDepartmentPhone(patient.procedure) ? <a href={`tel:${patient.procedure.departmentPhone}`} className="mt-2 flex min-h-[48px] items-center justify-center rounded-lg border border-hairline-strong font-semibold text-ink">Call the department</a> : null}
        </Card>
      </div>
    </>
  )
}
