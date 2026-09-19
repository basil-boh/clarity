import { Card, SectionTitle } from '@/components/ui'
import { FlagRule, SignalMeter } from '@/components/signal'
import { BowelInput, DietInput, FluidInput } from '@/components/SignalInputs'
import { Icon } from '@/components/Icon'
import { NoRecord } from '@/components/NoRecord'
import { buildPlan, offsetFor } from '@/domain/prep'
import {
  FLAG_LABEL,
  FLAG_MEANING,
  SIGNAL_NAMES,
  WEIGHTS,
  computeFlag,
  type Signals,
  type BowelScalePoint,
  type DietAnswer,
} from '@/domain/progress'
import { livePatient } from '@/lib/patients'
import {
  fluidToday,
  prepTimingFrom,
  readProgress,
  recordDietDay,
  recordFluid,
  recordStool,
} from '@/lib/progress'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Progress — Clarity' }

/**
 * The tracker.
 *
 * Shows the same four signals the ward sees on the morning of the procedure,
 * weighted the same way. A patient who can see which signal is dragging can
 * still fix it; a tracker that reported a different number from the ward's
 * would be worse than no tracker at all.
 */
export default async function Progress() {
  const session = await requireSession()
  const progress = await readProgress()
  const patient = await livePatient(
    session.phone,
    progress,
    prepTimingFrom(progress.doses),
  )
  if (!patient) return <NoRecord phone={session.phone} />

  const flag = computeFlag(patient.signals)

  const plan = buildPlan(patient.procedure.date)
  const offset = offsetFor(patient.procedure.date)
  const allSteps = plan.filter((d) => d.offset <= offset).flatMap((d) => d.steps)
  const doneCount = allSteps.filter((s) => patient.completed.includes(s.uid)).length

  const keys = Object.keys(WEIGHTS) as (keyof Signals)[]

  async function saveFluid(glasses: number): Promise<number> {
    'use server'
    return fluidToday(await recordFluid(glasses))
  }

  async function saveStool(point: BowelScalePoint | null): Promise<BowelScalePoint | null> {
    'use server'
    return (await recordStool(point)).stoolPoint
  }

  async function saveDiet(dayOffset: number, answer: DietAnswer): Promise<DietAnswer> {
    'use server'
    const next = await recordDietDay(dayOffset, answer)
    return next.dietDays[String(dayOffset)]
  }

  return (
    <>
      <header className="mb-7">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          Your progress
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
          This is the same summary your nurse sees on the morning.
        </p>
      </header>

      <Card className="mb-5">
        <FlagRule colour={flag.colour} label={FLAG_LABEL[flag.colour]} />
        <p className="mt-3 text-[17px] leading-relaxed text-ink">{FLAG_MEANING[flag.colour]}</p>
      </Card>

      <section className="mb-6">
        <SectionTitle>Record today</SectionTitle>
        <Card className="space-y-5">
          <FluidInput glasses={fluidToday(progress)} onRecord={saveFluid} />
          <BowelInput point={progress.stoolPoint} onRecord={saveStool} />
          <DietInput
            offset={offset}
            answer={progress.dietDays[String(offset)]}
            onRecord={saveDiet}
          />
        </Card>
      </section>

      <section className="mb-5">
        <SectionTitle>Steps done so far</SectionTitle>
        <Card>
          <p className="text-[26px] font-bold tabular-nums tracking-[-0.02em] text-ink">
            <span className="font-mono">{doneCount}</span>{' '}
            <span className="font-mono text-ink-faint">/ {allSteps.length || 0}</span>
          </p>
          <p className="mt-1 text-[15px] text-ink-muted">
            Counted from the start of your run-up to today.
          </p>
        </Card>
      </section>

      <section className="mb-5">
        <SectionTitle>The four signals</SectionTitle>
        <Card>
          <ul className="space-y-6">
            {keys.map((key) => (
              <li key={key}>
                <SignalMeter
                  label={SIGNAL_NAMES[key]}
                  value={patient.signals[key]}
                  weight={WEIGHTS[key]}
                />
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {flag.reasons.length > 0 ? (
        <section>
          <SectionTitle>Why it says that</SectionTitle>
          <Card>
            <ul className="list-none space-y-2">
              {flag.reasons.map((reason) => (
                <li key={reason} className="flex gap-2.5 text-[16px] leading-relaxed text-ink-muted">
                  <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-ink-faint" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      <p className="mt-7 text-[15px] leading-relaxed text-ink-faint">
        A signal that was never recorded is not a failure. It is shown as &ldquo;not
        recorded&rdquo; and left out of the summary rather than counted as zero.
      </p>
    </>
  )
}
