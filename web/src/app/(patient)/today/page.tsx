import Link from 'next/link'
import { format, parseISO } from 'date-fns'

import { Card, Notice, SectionTitle, Stat } from '@/components/ui'
import { Wordmark } from '@/components/brand'
import { FlagRule } from '@/components/signal'
import { StepList } from '@/components/StepList'
import {
  PHASE_COPY,
  type Phase,
  buildPlan,
  currentDay,
  headingFor,
  hasDepartmentPhone,
  offsetFor,
  phaseFor,
} from '@/domain/prep'
import { FLAG_LABEL, computeFlag } from '@/domain/progress'
import { livePatient } from '@/lib/patients'
import { formatPhone } from '@/lib/phone'
import { readProgress, prepTimingFrom } from '@/lib/progress'
import { translation } from '@/lib/language'
import { requireSession } from '@/lib/session'
import { NoPatient } from '@/components/NoPatient'
import { CalendarExportButton } from '@/components/CalendarExportButton'
import { TelegramConnect } from '@/components/TelegramConnect'

import { tickStep } from '../actions'

export const metadata = { title: 'Home — Clarity' }

/**
 * When to offer the calendar download.
 *
 * Only near the procedure, because the .ics is a **snapshot**: it is written
 * once, from the date as it stands, and nothing updates it afterwards. A
 * patient who downloads it a year out and is then rescheduled -- and they
 * frequently are -- ends up with alarms for the wrong night and no reason to
 * suspect it.
 */
const CALENDAR_PHASES = new Set<Phase>(['week_before', 'diet_day', 'purge_night'])

/**
 * When to offer Telegram. Any time before the procedure.
 *
 * The opposite of the calendar, because the link is **live**: the reminders are
 * worked out from the procedure date at send time, so connecting early is
 * always correct and a reschedule fixes itself.
 *
 * And connecting early is the whole point. `waiting` is the phase this app
 * exists for -- the sheet is handed over at the referral and not looked at
 * again for up to two years -- so the visit where a patient is most likely to
 * set something up is precisely the one that used to hide this card. Someone
 * who opens the app once, months ahead, should leave with their reminders
 * already working.
 */
const REMINDER_PHASES = new Set<Phase>([
  'waiting',
  'week_before',
  'diet_day',
  'purge_night',
  'procedure_day',
])

export default async function Today() {
  const session = await requireSession()
  const { t } = await translation()
  const progress = await readProgress()
  const patient = await livePatient(
    session.phone,
    progress,
    prepTimingFrom(progress.doses),
  )
  if (!patient) return <NoPatient phone={session.phone} />

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
          // Blank where the patient entered their own date and nobody filled in
          // a hospital, rather than "Arrive 08:00 · " trailing into nothing.
          sub={[`Arrive ${procedure.arriveAt}`, procedure.hospital].filter(Boolean).join(' · ')}
        />
        {procedure.location ? (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{procedure.location}</p>
        ) : null}
        {hasDepartmentPhone(procedure) ? (
          <a
            href={`tel:${procedure.departmentPhone}`}
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
          >
            Call the department
          </a>
        ) : null}
        <Link
          href="/welcome"
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
        >
          {t.common.changeDetails}
        </Link>
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

      {/*
        The doses are the outcome and the second is at 2am, so there are two
        ways to be reminded and a patient wants both. This one needs nothing
        from them on the night -- it is why it comes first, and why it is
        offered from the very first visit.
      */}
      {REMINDER_PHASES.has(phase) ? <TelegramConnect phone={session.phone} t={t} /> : null}

      {/*
        And this one needs no server, no signal and no account: the alarm lives
        on the patient's own phone once it is downloaded. Belt and braces, for
        the one night where being woken actually decides the outcome.
      */}
      {CALENDAR_PHASES.has(phase) ? (
        <section className="mb-5">
          <SectionTitle>Alarms for your doses</SectionTitle>
          <Card>
            <p className="text-[16px] leading-relaxed text-ink-muted">
              The second dose is at 2am, and it is the one most often missed. Add the prep to your
              phone&rsquo;s calendar and it will alarm you half an hour before each dose — even
              with no signal.
            </p>
            <CalendarExportButton procedure={procedure} plan={plan} />
          </Card>
        </section>
      ) : null}

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
            <Link href="/verify" className="pb-0.5 text-[15px] font-semibold text-blue">
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
