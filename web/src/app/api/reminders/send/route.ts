import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

import { languageOr } from '@/domain/i18n'
import { buildPlan } from '@/domain/prep'
import { dueReminders, type DueReminder } from '@/domain/reminders'
import { findPatient } from '@/lib/patients'
import {
  alreadySent,
  claimSend,
  releaseSend,
  reminderRecipients,
  stopRemindersFor,
} from '@/lib/reminder-store'
import { remindersEnabled, sendMessage, telegramConfigured } from '@/lib/telegram'
import { dictionary } from '@/messages'

/**
 * The reminder run. Supabase Cron calls this every fifteen minutes.
 *
 * It is a poll rather than two scheduled sends at 17:30 and 01:30, because a
 * reminder stays due for the half hour before its dose: a late or missed run
 * still catches the patient. The failure this feature exists to prevent is a
 * missed 2am dose, so it is worth polling for.
 *
 * Nothing here decides *when* a dose is -- `domain/reminders.ts` does, and it
 * is tested. This route is the plumbing around it: who is connected, what has
 * gone already, and what Telegram said.
 */

export const dynamic = 'force-dynamic'
/** Long enough for a pilot cohort's sends; well inside the platform default. */
export const maxDuration = 60

function authorised(request: Request): boolean {
  const expected = process.env.REMINDER_CRON_SECRET
  // No secret means no protection, and this endpoint messages patients. It
  // refuses rather than running open.
  if (!expected) return false

  const given = request.headers.get('x-reminder-key') ?? ''
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/**
 * Pretend it is another time, for testing a purge night without waiting for one.
 *
 * Refused in production. The send log still guards against duplicates, so the
 * worst this can do on a development database is send a reminder early -- but
 * "send a reminder early" is precisely the bug this whole module is built to
 * avoid, and an operator who can set the clock can cause it.
 */
function overrideNow(request: Request): Date | null {
  if (process.env.NODE_ENV === 'production') return null
  const raw = new URL(request.url).searchParams.get('at')
  if (!raw) return null
  const at = new Date(raw)
  if (Number.isNaN(at.getTime())) return null
  console.warn(`[colonaid] reminder run using overridden clock: ${at.toISOString()}`)
  return at
}

/**
 * The message a patient actually receives.
 *
 * Shaped around the notification preview, because that is all most people will
 * read: Telegram shows the first line, so the first line is the dose and the
 * time and nothing else. Someone glancing at a locked screen at 1:30am should
 * not have to open anything to know what is being asked of them.
 *
 * The rest is bolded sparingly. Everything emphasised is the same as nothing
 * emphasised, so only the headline is bold and the footer is dimmed to stay out
 * of the way.
 */
function composeMessage(reminder: DueReminder, language: string): string {
  const t = dictionary(languageOr(language)).reminders
  const second = reminder.step.id === 'dose-2'

  // Which dose, and when. That is the whole message: the instructions live in
  // the app and on the department's sheet, and a text that half-repeats them
  // can only end up disagreeing with one of them. It says what is happening and
  // sends the patient to the place that knows the rest.
  const title = (second ? t.titleSecond : t.titleFirst).replace('{time}', reminder.step.at)

  return [`⏰ <b>${title}</b>`, t.lead, '', t.body, '', `<i>${t.footer}</i>`].join('\n')
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  if (!telegramConfigured()) {
    console.warn('[colonaid] reminder run skipped: TELEGRAM_BOT_TOKEN is not set.')
    return NextResponse.json({ ok: true, skipped: 'telegram-not-configured' })
  }

  const now = overrideNow(request) ?? new Date()

  // `?phone=` narrows the run to one patient. Allowed in production, unlike the
  // clock override: it only ever sends what was genuinely due anyway, and
  // "re-run tonight for this one patient" is a real thing to need at 1am when
  // someone rings the department saying they got nothing.
  const only = new URL(request.url).searchParams.get('phone')
  const all = await reminderRecipients()
  const recipients = only ? all.filter((r) => r.phone === only) : all

  if (only && recipients.length === 0) {
    return NextResponse.json({
      ok: true,
      at: now.toISOString(),
      note: `No connected recipient for ${only}.`,
      recipients: 0,
      sent: 0,
      failed: 0,
    })
  }

  let sent = 0
  let failed = 0
  const considered: string[] = []

  for (const recipient of recipients) {
    try {
      const patient = await findPatient(recipient.phone)
      if (!patient) continue

      const plan = buildPlan(patient.procedure.date, now)
      const due = dueReminders(plan, now, await alreadySent(recipient.phone))
      if (due.length === 0) continue

      for (const reminder of due) {
        // Claim first: two overlapping runs would otherwise both read an empty
        // log and both message the patient in the middle of the night.
        if (!(await claimSend(recipient.phone, reminder.key))) continue

        considered.push(`${recipient.phone} ${reminder.key}`)
        const result = await sendMessage(
          recipient.chatId,
          composeMessage(reminder, patient.profile.language),
        )

        if (result.ok) {
          sent += 1
        } else {
          failed += 1
          if (result.blocked) {
            // They blocked the bot. That is a withdrawal of consent, not a
            // transient error -- stop, and keep the claim so we do not retry.
            console.info(`[colonaid] ${recipient.phone} has blocked the bot; stopping reminders.`)
            await stopRemindersFor(recipient.phone)
          } else {
            // Transient: give the slot back so the next run tries again, while
            // the dose is still ahead of the patient.
            await releaseSend(recipient.phone, reminder.key)
          }
          console.error(`[colonaid] reminder to ${recipient.phone} failed: ${result.error}`)
        }
      }
    } catch (err) {
      failed += 1
      console.error(`[colonaid] reminder run failed for ${recipient.phone}`, err)
    }
  }

  const summary = {
    ok: true,
    at: now.toISOString(),
    dryRun: !remindersEnabled(),
    recipients: recipients.length,
    sent,
    failed,
  }
  // One line per run, so a purge night can be read back out of the logs.
  console.info(`[colonaid] reminder run ${JSON.stringify(summary)}`, considered)
  return NextResponse.json(summary)
}
