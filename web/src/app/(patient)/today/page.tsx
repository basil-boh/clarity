import { getI18n } from '@/lib/i18n-server'
import Link from 'next/link'
import { parseISO } from 'date-fns'

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
import { TelegramConnect } from '@/components/TelegramConnect'

import { tickStep } from '../actions'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Home — Clarity') }
}

/**
 * When to offer Telegram. Any time before the procedure.
 *
 * The link is **live**: the reminders are
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
  const { tx, dateFormat } = await getI18n()

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
          {tx(headingFor(offset))}
        </h1>
        <p className="mt-2 text-[17px] text-ink-muted">
          {tx(profile.reader === 'caregiver'
            ? `You are preparing with ${profile.displayName}.`
            : `Hello, ${profile.displayName.split(' ')[0]}.`)}
        </p>
      </header>

      {offset === -1 ? (
        <div className="mb-5">
          <Notice tone="alert">{tx("Tonight decides whether the scope works. Finish the whole volume, at the times below.")}</Notice>
        </div>
      ) : null}

      <Card className="mb-5">
        <Stat
          label={tx("Your appointment")}
          value={dateFormat(date, 'EEEE d MMMM yyyy')}
          // Blank where the patient entered their own date and nobody filled in
          // a hospital, rather than "Arrive 08:00 · " trailing into nothing.
          sub={[tx('Arrive {0}', { 0: procedure.arriveAt }), tx(procedure.hospital)].filter(Boolean).join(' · ')}
        />
        {procedure.location ? (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{tx(procedure.location)}</p>
        ) : null}
        {hasDepartmentPhone(procedure) ? (
          <a
            href={`tel:${procedure.departmentPhone}`}
            className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
          >{tx("Call the hospital/clinic")}</a>
        ) : null}
        <Link
          href="/welcome"
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
        >
          {tx(t.common.changeDetails)}
        </Link>
      </Card>

      <section className="mb-5">
        <SectionTitle>{tx("Where you are")}</SectionTitle>
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
              {tx(PHASE_COPY[phase].name)}
            </h3>
            <Link href="/journey" className="text-[15px] font-semibold text-blue">{tx("All stages")}</Link>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-ink-muted">
            {tx(PHASE_COPY[phase].blurb)}
          </p>
        </Card>
      </section>

      {REMINDER_PHASES.has(phase) ? <TelegramConnect phone={session.phone} t={t} /> : null}

      {phase === 'purge_night' ? (
        <section className="mb-5">
          <SectionTitle>{tx("The preparation")}</SectionTitle>
          <Card>
            <p className="text-[16px] leading-relaxed text-ink-muted">{tx("Record each glass as you finish it. It is the one thing here that changes what the nurse sees in the morning.")}</p>
            <Link
              href="/doses"
              className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg bg-blue px-4 text-[17px] font-semibold text-white"
            >{tx("Track tonight’s doses")}</Link>
          </Card>
        </section>
      ) : null}

      {day && day.steps.length > 0 ? (
        <section className="mb-5">
          <SectionTitle>{tx("What to do today")}</SectionTitle>
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
        <SectionTitle>{tx("How your prep is going")}</SectionTitle>
        <Card>
          {/* No "See details" any more: /verify is the guided stool check and
              nothing else, so the link led to a page with no details on it. */}
          <FlagRule colour={flag.colour} label={tx(FLAG_LABEL[flag.colour])} width="short" />
        </Card>
      </section>

      <p className="mt-8 border-t border-hairline pt-5 text-[14px] leading-relaxed text-ink-faint">{tx("Signed in as")}{' '}{tx(formatPhone(session.phone))}.{tx(' ')}
        <Link href="/sign-out" className="underline underline-offset-2">{tx("Sign out")}</Link>
      </p>
    </>
  )
}
