import Link from 'next/link'
import { format, parseISO } from 'date-fns'

import { Card, Notice, SectionTitle, Stat } from '@/components/ui'
import { Wordmark } from '@/components/brand'
import { FlagRule } from '@/components/signal'
import { StepList } from '@/components/StepList'
import {
  PHASE_COPY,
  buildPlan,
  currentDay,
  headingFor,
  offsetFor,
  phaseFor,
} from '@/domain/prep'
import { FLAG_LABEL, computeFlag } from '@/domain/progress'
import { livePatient } from '@/lib/patients'
import { formatPhone } from '@/lib/phone'
import { readProgress, prepTimingFrom } from '@/lib/progress'
import { requireSession } from '@/lib/session'
import { NoRecord } from '@/components/NoRecord'

import { tickStep } from '../actions'

export const metadata = { title: 'Today — Clarity' }

export default async function Today() {
  const session = await requireSession()
  const progress = await readProgress()
  const patient = await livePatient(
    session.phone,
    progress,
    prepTimingFrom(progress.doses),
  )
  if (!patient) return <NoRecord phone={session.phone} />

  const { procedure, profile, signals, completed } = patient
  const offset = offsetFor(procedure.date)
  const phase = phaseFor(offset)
  const plan = buildPlan(procedure.date)
  const day = currentDay(plan, offset)
  const flag = computeFlag(signals)
  const date = parseISO(procedure.date)

  return (
    <>
      <header className="mb-7">
        <Wordmark width={116} />
        <h1 className="mt-4 text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          {headingFor(offset)}
        </h1>
        <p className="mt-2 text-[17px] text-ink-muted">
          {profile.reader === 'caregiver'
            ? `You are preparing with ${profile.displayName}.`
            : `Hello, ${profile.displayName.split(' ')[0]}.`}
        </p>
      </header>

      {offset === -1 ? (
        <div className="mb-5">
          <Notice tone="alert">
            Tonight decides whether the scope works. Finish the whole volume, at the times below.
          </Notice>
        </div>
      ) : null}

      <Card className="mb-5">
        <Stat
          label="Your appointment"
          value={format(date, 'EEEE d MMMM yyyy')}
          sub={`Arrive ${procedure.arriveAt} · ${procedure.hospital}`}
        />
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{procedure.location}</p>
        <a
          href={`tel:${procedure.departmentPhone}`}
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
        >
          Call the department
        </a>
      </Card>

      <section className="mb-5">
        <SectionTitle>Where you are</SectionTitle>
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
              {PHASE_COPY[phase].name}
            </h3>
            <Link href="/journey" className="text-[15px] font-semibold text-blue">
              All stages
            </Link>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-ink-muted">
            {PHASE_COPY[phase].blurb}
          </p>
        </Card>
      </section>

      {phase === 'purge_night' ? (
        <section className="mb-5">
          <SectionTitle>The preparation</SectionTitle>
          <Card>
            <p className="text-[16px] leading-relaxed text-ink-muted">
              Record each glass as you finish it. It is the one thing here that changes what the
              nurse sees in the morning.
            </p>
            <Link
              href="/doses"
              className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-blue px-4 text-[17px] font-semibold text-white"
            >
              Track tonight&rsquo;s doses
            </Link>
          </Card>
        </section>
      ) : null}

      {day && day.steps.length > 0 ? (
        <section className="mb-5">
          <SectionTitle>What to do today</SectionTitle>
          <Card>
            <StepList
              steps={day.steps}
              completed={completed}
              tickable={day.steps.map((step) => step.uid)}
              onToggle={tickStep}
            />
          </Card>
        </section>
      ) : null}

      <section>
        <SectionTitle>How your prep is going</SectionTitle>
        <Card>
          <div className="flex items-end justify-between gap-4">
            <FlagRule colour={flag.colour} label={FLAG_LABEL[flag.colour]} width="short" />
            <Link href="/progress" className="pb-0.5 text-[15px] font-semibold text-blue">
              See details
            </Link>
          </div>
        </Card>
      </section>

      <p className="mt-8 border-t border-hairline pt-5 text-[14px] leading-relaxed text-ink-faint">
        Signed in as {formatPhone(session.phone)}.{' '}
        <Link href="/sign-out" className="underline underline-offset-2">
          Sign out
        </Link>
      </p>
    </>
  )
}
