import Link from 'next/link'
import { notFound } from 'next/navigation'
import { addDays, format, parseISO } from 'date-fns'

import { FlagRule, SignalMeter } from '@/components/signal'
import { Card, Notice, SectionTitle, Stat } from '@/components/ui'
import {
  PHASE_COPY,
  buildPlan,
  dosesFor,
  headingFor,
  inSingapore,
  offsetFor,
  phaseFor,
} from '@/domain/prep'
import { resolveMedicationDate } from '@/domain/medications'
import {
  BOWEL_SCALE,
  DIET_ANSWERS,
  FLAG_LABEL,
  FLUID_TARGET_GLASSES,
  NEVER,
  SIGNAL_NAMES,
  WEIGHTS,
  computeFlag,
  type Signals,
} from '@/domain/progress'
import { patientDetails, requireAdmin, type ChatMessage, type PatientDetails } from '@/lib/admin'
import type { LivePatient } from '@/lib/patients'
import { formatPhone } from '@/lib/phone'
import { glassesOf } from '@/lib/progress'
import { usingDatabase } from '@/lib/source'

import { resetPatient } from '../../actions'
import { ALL_PATIENTS, AdminHeader, NoDatabase } from '../../AdminShell'

export const metadata = { title: 'Patient — Clarity admin' }

const DONE: Record<string, string> = {
  saved: 'Saved. The patient sees the change the next time a screen loads.',
  reset: 'Recorded progress cleared.',
}

/** A stored instant, as the time on a clock in Singapore. */
const stamp = (iso: string) => format(inSingapore(parseISO(iso)), 'd MMM yyyy, HH:mm')

/**
 * Everything held against one number, read-only. Editing is one click away on
 * `/edit`, so the page someone lands on from the list cannot change anything by
 * a stray tap.
 *
 * `/admin/patients/6591234567` -- the number without its `+`, which keeps the
 * URL free of anything that needs escaping.
 */
export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ phone: string }>
  searchParams: Promise<{ done?: string }>
}) {
  await requireAdmin()

  if (!usingDatabase()) {
    return (
      <>
        <AdminHeader title="Patient" back={ALL_PATIENTS} />
        <NoDatabase />
      </>
    )
  }

  const [{ phone: digits }, { done }] = await Promise.all([params, searchParams])
  if (!/^\d{8,15}$/.test(digits)) notFound()
  const details = await patientDetails(`+${digits}`)
  if (!details) notFound()

  const { patient } = details

  return (
    <>
      <AdminHeader title={patient.displayName || formatPhone(patient.phone)} back={ALL_PATIENTS} />

      <div className="-mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[17px] text-ink-muted">
          <span className="font-mono">{formatPhone(patient.phone)}</span>
          {' · '}
          {patient.reader === 'caregiver' ? 'A caregiver reads the app' : 'The patient reads the app'}
        </p>
        <Link
          href={`/admin/patients/${digits}/edit`}
          className="inline-flex min-h-[48px] items-center rounded-lg border border-hairline-strong bg-paper px-5 text-[16px] font-semibold text-ink hover:bg-paper-sunken"
        >
          Edit details
        </Link>
      </div>

      {done && DONE[done] ? (
        <div className="mb-5">
          <Notice>{DONE[done]}</Notice>
        </div>
      ) : null}

      <div className="space-y-5">
        <Booking details={details} digits={digits} />
        {details.live ? <Readiness live={details.live} /> : null}
        <Recorded details={details} />
        <Medications details={details} />
        <Chat messages={details.chat} />
        <Codes codes={details.codes} />
        <Reset details={details} />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------

function Booking({ details, digits }: { details: PatientDetails; digits: string }) {
  const { procedure } = details.patient

  if (!procedure) {
    return (
      <Card>
        <SectionTitle>Booking</SectionTitle>
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Nothing is booked, so this patient sees &ldquo;Nothing booked under this number&rdquo;.{' '}
          <Link
            href={`/admin/patients/${digits}/edit`}
            className="font-semibold text-blue underline-offset-4 hover:underline"
          >
            Add their procedure
          </Link>
        </p>
      </Card>
    )
  }

  const offset = offsetFor(procedure.date)
  const date = parseISO(procedure.date)

  return (
    <Card>
      <SectionTitle>Booking</SectionTitle>
      <div className="grid gap-5 sm:grid-cols-3">
        <Stat
          label="Procedure"
          value={<span className="font-mono">{format(date, 'd MMM yyyy')}</span>}
          sub={format(date, 'EEEE')}
        />
        <Stat label="Arrive at" value={<span className="font-mono">{procedure.arriveAt}</span>} />
        <Stat
          label="Stage today"
          value={PHASE_COPY[phaseFor(offset)].name}
          sub={headingFor(offset)}
        />
      </div>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-hairline pt-4 text-[16px]">
        <dt className="text-ink-faint">Hospital</dt>
        <dd className="text-ink">{procedure.hospital}</dd>
        <dt className="text-ink-faint">Where</dt>
        <dd className="text-ink">{procedure.location || '—'}</dd>
        <dt className="text-ink-faint">Department</dt>
        <dd className="font-mono text-ink">{formatPhone(procedure.departmentPhone)}</dd>
      </dl>
    </Card>
  )
}

function Readiness({ live }: { live: LivePatient }) {
  const flag = computeFlag(live.signals)
  const keys = Object.keys(WEIGHTS) as (keyof Signals)[]

  return (
    <Card>
      <SectionTitle>Prep readiness</SectionTitle>
      <FlagRule colour={flag.colour} label={FLAG_LABEL[flag.colour]} />
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        The same summary the patient sees on their Progress screen.
      </p>

      <ul className="mt-5 grid gap-6 sm:grid-cols-2">
        {keys.map((key) => (
          <li key={key}>
            <SignalMeter label={SIGNAL_NAMES[key]} value={live.signals[key]} weight={WEIGHTS[key]} />
          </li>
        ))}
      </ul>

      {flag.reasons.length > 0 ? (
        <ul className="mt-5 space-y-1.5 border-t border-hairline pt-4">
          {flag.reasons.map((reason) => (
            <li key={reason} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-muted">
              <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-ink-faint" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt>
        <span className="text-[16px] font-semibold text-ink">{label}</span>
        {sub ? <span className="ml-2 text-[14px] text-ink-faint">{sub}</span> : null}
      </dt>
      <dd className="text-[16px] text-ink">{children}</dd>
    </div>
  )
}

const NOT_RECORDED = <span className="text-ink-faint">Not recorded</span>

function Recorded({ details }: { details: PatientDetails }) {
  const { progress, live, lastRecordedAt, patient } = details
  const dietDays = Object.entries(progress.dietDays).sort(([a], [b]) => Number(a) - Number(b))
  const fluidDays = Object.entries(progress.fluidDays)
    .filter(([, glasses]) => glasses > 0)
    .sort(([a], [b]) => a.localeCompare(b))
  const stool = progress.stoolPoint

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <SectionTitle>What they recorded</SectionTitle>
        <span className="mb-3 text-[14px] text-ink-faint">
          {lastRecordedAt ? `Last recorded ${stamp(lastRecordedAt)}` : 'Nothing recorded yet'}
        </span>
      </div>

      <dl className="divide-y divide-hairline border-y border-hairline">
        {dosesFor().map((dose) => {
          const ml = progress.doses[dose.id] ?? 0
          return (
            <Row key={dose.id} label={dose.label} sub={`due ${dose.at}`}>
              {ml > 0 ? (
                <>
                  <span className="font-mono">
                    {ml} / {dose.volumeMl} ml
                  </span>
                  <span className="text-ink-muted">
                    {' · '}
                    {glassesOf(ml)} of {glassesOf(dose.volumeMl)} glasses
                  </span>
                </>
              ) : (
                NOT_RECORDED
              )}
            </Row>
          )
        })}

        <Row label="Clear fluid">
          {fluidDays.length > 0 ? (
            <ul className="text-right">
              {fluidDays.map(([date, glasses]) => (
                <li key={date}>
                  <span className="font-mono text-ink-muted">
                    {format(parseISO(date), 'EEE d MMM')}
                  </span>{' '}
                  <span className="font-mono">
                    {glasses} / {FLUID_TARGET_GLASSES}
                  </span>{' '}
                  glasses
                </li>
              ))}
            </ul>
          ) : (
            NOT_RECORDED
          )}
        </Row>

        <Row label="Bowel scale">
          {stool ? (
            <>
              <span className="font-mono">{stool} / 5</span>
              <span className="text-ink-muted"> · {BOWEL_SCALE[stool].label}</span>
            </>
          ) : (
            NOT_RECORDED
          )}
        </Row>

        <Row label="Diet days">
          {dietDays.length > 0 && patient.procedure ? (
            <ul className="text-right">
              {dietDays.map(([offset, answer]) => (
                <li key={offset}>
                  <span className="font-mono text-ink-muted">
                    {format(addDays(parseISO(patient.procedure!.date), Number(offset)), 'EEE d MMM')}
                  </span>{' '}
                  {DIET_ANSWERS.find((a) => a.id === answer)?.label ?? answer}
                </li>
              ))}
            </ul>
          ) : (
            NOT_RECORDED
          )}
        </Row>
      </dl>

      {live ? <Steps live={live} /> : null}
    </Card>
  )
}

function dayName(offset: number): string {
  if (offset === 0) return 'Procedure day'
  if (offset === -1) return 'The day before'
  return `${-offset} days before`
}

/** Steps due so far, counted the way the patient's Progress screen counts them. */
function Steps({ live }: { live: LivePatient }) {
  const today = offsetFor(live.procedure.date)
  const days = buildPlan(live.procedure.date).filter(
    (day) => day.offset <= today && day.steps.length > 0,
  )
  const steps = days.flatMap((day) => day.steps)
  const done = steps.filter((step) => live.completed.includes(step.uid)).length

  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-[16px] font-semibold text-ink">
        Steps ticked off{' '}
        <span className="font-mono font-normal text-ink-muted">
          {done} / {steps.length}
        </span>
      </summary>
      {days.length === 0 ? (
        <p className="mt-3 text-[15px] text-ink-muted">No steps are due yet.</p>
      ) : (
        days.map((day) => (
          <div key={day.offset} className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.11em] text-ink-faint">
              {dayName(day.offset)} · {format(parseISO(day.date), 'EEE d MMM')}
            </h3>
            <ul className="mt-2 space-y-1.5">
              {day.steps.map((step) => {
                const ticked = live.completed.includes(step.uid)
                return (
                  <li key={step.uid} className="flex gap-2.5 text-[16px] leading-snug">
                    <span aria-hidden className={`w-4 shrink-0 ${ticked ? 'text-blue' : 'text-ink-faint'}`}>
                      {ticked ? '✓' : '–'}
                    </span>
                    <span className={ticked ? 'text-ink' : 'text-ink-muted'}>
                      {step.title}
                      <span className="sr-only">{ticked ? ' (done)' : ' (not done)'}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}
    </details>
  )
}

/** What the patient confirmed from their department's sheet -- their words, not the app's. */
function Medications({ details }: { details: PatientDetails }) {
  const { medications, patient } = details
  const procedureDate = patient.procedure?.date ?? null
  const day = (value: string | null) => {
    const date = procedureDate ? resolveMedicationDate(value, procedureDate) : null
    return date ? format(parseISO(date), 'EEE d MMM') : null
  }

  return (
    <Card>
      <SectionTitle>Medication instructions</SectionTitle>
      {medications.length === 0 ? (
        <p className="text-[17px] text-ink-muted">None added to their plan.</p>
      ) : (
        <ul className="divide-y divide-hairline">
          {medications.map((entry) => {
            const d = entry.draft
            const from = day(d.start)
            const until = d.end ? day(d.end) : null
            return (
              <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-[16px] font-semibold text-ink">
                  {d.action === 'hold' ? 'Do not take' : 'Take'} {d.name}
                  {d.strength ? <span className="font-normal text-ink-muted"> · {d.strength}</span> : null}
                </p>
                <p className="mt-0.5 text-[15px] text-ink-muted">
                  {d.action === 'hold'
                    ? `From ${from ?? d.start}${d.startTime ? ` at ${d.startTime}` : ''}`
                    : entry.reminderTimes
                        .map((time, i) => `${entry.doseAmounts[i] || 'Dose'} at ${time}`)
                        .join(', ')}
                  {d.action === 'take' && from ? `, from ${from}` : ''}
                  {until ? ` until ${until}` : ''}
                </p>
                {d.sourceText ? (
                  <p className="mt-1.5 border-l-2 border-hairline-strong pl-3 text-[14px] leading-relaxed text-ink-faint">
                    &ldquo;{d.sourceText}&rdquo;
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function Chat({ messages }: { messages: readonly ChatMessage[] }) {
  const escalated = messages.filter((m) => m.escalated).length

  return (
    <Card>
      <SectionTitle>Assistant chat</SectionTitle>
      {messages.length === 0 ? (
        <p className="text-[17px] text-ink-muted">Has not used the assistant.</p>
      ) : (
        <>
          <p className="text-[15px] text-ink-muted">
            {messages.length} message{messages.length === 1 ? '' : 's'}, oldest first
            {escalated > 0
              ? ` · told to call the department ${escalated} time${escalated === 1 ? '' : 's'}`
              : ''}
          </p>
          <ol className="mt-4 space-y-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className={
                  message.role === 'patient'
                    ? 'rounded-lg bg-paper-sunken px-4 py-3'
                    : 'rounded-lg border border-hairline px-4 py-3'
                }
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                  <span className="font-semibold text-ink">
                    {message.role === 'patient' ? 'Patient' : 'Assistant'}
                  </span>
                  <span className="font-mono text-ink-faint">{stamp(message.at)}</span>
                  {message.escalated ? (
                    <span className="rounded-full bg-alert-tint px-2 py-0.5 font-semibold text-alert">
                      Told to call
                    </span>
                  ) : null}
                  {message.blockedRule ? (
                    <span className="rounded-full bg-paper-sunken px-2 py-0.5 font-semibold text-ink-muted">
                      Reply replaced:{' '}
                      {NEVER.find((rule) => rule.id === message.blockedRule)?.rule ??
                        message.blockedRule}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-[16px] leading-relaxed text-ink">
                  {message.content}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </Card>
  )
}

function Codes({ codes }: { codes: PatientDetails['codes'] }) {
  return (
    <Card>
      <SectionTitle>Sign-in codes</SectionTitle>
      <p className="text-[17px] leading-relaxed text-ink-muted">
        {codes
          ? `Asked for a code ${codes.sends} time${codes.sends === 1 ? '' : 's'}, most recently ${stamp(codes.lastSentAt)}.`
          : 'Has never asked for a sign-in code.'}
      </p>
    </Card>
  )
}

function Reset({ details }: { details: PatientDetails }) {
  const { patient } = details
  const hasChat = details.chat.length > 0
  const anything = patient.recorded || hasChat

  return (
    <Card>
      <SectionTitle>Start the prep again</SectionTitle>
      <p className="text-[17px] leading-relaxed text-ink-muted">
        {anything
          ? 'Clears the doses, fluids, diet answers, bowel scale, ticked steps and assistant chat above. Their details and procedure stay.'
          : 'There is nothing recorded to clear.'}
      </p>
      <form action={resetPatient} className="mt-4">
        <input type="hidden" name="phone" value={patient.phone} />
        <button
          type="submit"
          disabled={!anything}
          className="inline-flex min-h-[48px] items-center rounded-lg border border-hairline-strong bg-paper px-5 text-[16px] font-semibold text-ink hover:bg-paper-sunken disabled:cursor-not-allowed disabled:opacity-45"
        >
          Clear recorded progress
        </button>
      </form>
    </Card>
  )
}
