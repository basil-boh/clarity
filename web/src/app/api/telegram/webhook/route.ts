import { NextResponse } from 'next/server'

import { languageOr } from '@/domain/i18n'
import { findPatient } from '@/lib/patients'
import { redeemLinkToken, stopReminders } from '@/lib/reminder-store'
import { sendMessage } from '@/lib/telegram'
import { dictionary } from '@/messages'

/**
 * What the bot hears.
 *
 * Telegram posts every update here. Two commands matter:
 *
 *   /start <token>   the patient tapped the deep link from the app -- tie this
 *                    chat to the phone the token was issued to
 *   /stop            turn the reminders off
 *
 * **Always answers 200.** Telegram retries anything else, and a bug that made
 * this throw would turn into an endless redelivery loop against a webhook that
 * was never going to succeed. Failures are logged and swallowed.
 */

/** Telegram echoes this back on every update; it is what makes the path private. */
function secretOk(request: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  // Refuse rather than fall open. Without a secret anyone who finds the path
  // can post an update and link their own chat to a patient's reminders.
  if (!expected) return false
  return request.headers.get('x-telegram-bot-api-secret-token') === expected
}

type Update = {
  message?: {
    chat?: { id?: number }
    text?: string
  }
}

/** The patient's own language, so the bot answers in the one they chose. */
async function copyFor(phone: string | null) {
  const patient = phone ? await findPatient(phone) : null
  return dictionary(languageOr(patient?.profile.language))
}

export async function POST(request: Request) {
  if (!secretOk(request)) {
    // Not "unauthorised" in a way that says a secret exists.
    return NextResponse.json({ ok: true })
  }

  let update: Update
  try {
    update = (await request.json()) as Update
  } catch {
    return NextResponse.json({ ok: true })
  }

  const chatId = update.message?.chat?.id
  const text = (update.message?.text ?? '').trim()
  if (typeof chatId !== 'number' || !text) return NextResponse.json({ ok: true })

  try {
    if (text.startsWith('/start')) {
      const linkToken = text.slice('/start'.length).trim()
      const phone = linkToken ? await redeemLinkToken(linkToken, chatId) : null
      const t = await copyFor(phone)
      await sendMessage(chatId, phone ? t.reminders.botLinked : t.reminders.botUnknown)
      return NextResponse.json({ ok: true })
    }

    if (text.startsWith('/stop')) {
      const phone = await stopReminders(chatId)
      const t = await copyFor(phone)
      await sendMessage(chatId, t.reminders.botStopped)
      return NextResponse.json({ ok: true })
    }

    // Anything else. The bot is not an assistant -- /ask is, inside the app,
    // where it has the patient's plan and the guardrails around it. Answering
    // prep questions here with none of that context is how someone gets told
    // the wrong thing about their dose.
    const t = await copyFor(null)
    await sendMessage(chatId, t.reminders.botUnknown)
  } catch (err) {
    console.error('[colonaid] Telegram webhook failed', err)
  }

  return NextResponse.json({ ok: true })
}
