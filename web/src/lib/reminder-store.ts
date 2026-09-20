import 'server-only'

import { randomBytes } from 'node:crypto'

import { usingDatabase } from '@/lib/source'
import { db, logDbError, patientScope } from '@/lib/supabase'

/**
 * Who has connected Telegram, and what has already been sent.
 *
 * Database only. Without one there is nowhere to keep a chat id between the
 * request that creates the link and the cron run that uses it, so the feature
 * simply is not offered rather than half-working.
 */

/** Long enough that guessing is hopeless; short enough to paste into a link. */
const TOKEN_BYTES = 24
/**
 * How long a link stays good.
 *
 * It is a bearer credential: anyone holding it can point their own Telegram at
 * this patient's reminders. Thirty minutes is long enough to switch apps and
 * tap it, short enough that one left in a browser history is worthless.
 */
const TOKEN_MINUTES = 30

function logError(action: string, error: unknown) {
  const code = (error as { code?: string } | null)?.code
  const missing = code === '42P01' || code === 'PGRST205'
  logDbError(
    missing ? 'web_telegram missing, apply 0004_reminders.sql' : `web_telegram ${action}`,
    error,
  )
}

export type TelegramLink = {
  readonly linked: boolean
  readonly stopped: boolean
  readonly chatId: number | null
}

type Row = {
  chat_id: number | null
  link_token: string | null
  token_expires_at: string | null
  linked_at: string | null
  stopped: boolean
}

export async function readLink(phone: string): Promise<TelegramLink | null> {
  if (!usingDatabase()) return null
  const { data, error } = await patientScope(phone)
    .select<Row>('web_telegram', 'chat_id, link_token, token_expires_at, linked_at, stopped')
    .maybeSingle()
  if (error) {
    logError('read', error)
    return null
  }
  if (!data) return { linked: false, stopped: false, chatId: null }
  return {
    linked: Boolean(data.linked_at && data.chat_id),
    stopped: data.stopped,
    chatId: data.chat_id,
  }
}

/**
 * A fresh token for this patient's deep link.
 *
 * Replaces any outstanding one rather than reusing it, so a link shown on a
 * shared or borrowed device stops working as soon as the patient asks for
 * another.
 */
export async function issueLinkToken(phone: string): Promise<string | null> {
  if (!usingDatabase()) return null

  const linkToken = randomBytes(TOKEN_BYTES).toString('base64url')
  const { error } = await patientScope(phone).client.from('web_telegram').upsert(
    {
      phone,
      link_token: linkToken,
      token_expires_at: new Date(Date.now() + TOKEN_MINUTES * 60_000).toISOString(),
      // Asking for a new link is how someone comes back after /stop.
      stopped: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone' },
  )
  if (error) {
    logError('issue token', error)
    return null
  }
  return linkToken
}

/**
 * Redeem a token: tie this Telegram chat to the patient who was issued it.
 *
 * The token is cleared on use. Returns the phone so the bot can reply in the
 * patient's own language.
 */
export async function redeemLinkToken(linkToken: string, chatId: number): Promise<string | null> {
  if (!usingDatabase()) return null

  const { data, error } = await db()
    .from('web_telegram')
    .select('phone, token_expires_at')
    .eq('link_token', linkToken)
    .maybeSingle<{ phone: string; token_expires_at: string | null }>()

  if (error) {
    logError('redeem lookup', error)
    return null
  }
  if (!data) return null
  if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) return null

  const { error: writeError } = await db()
    .from('web_telegram')
    .update({
      chat_id: chatId,
      linked_at: new Date().toISOString(),
      link_token: null,
      token_expires_at: null,
      stopped: false,
      updated_at: new Date().toISOString(),
    })
    .eq('phone', data.phone)

  if (writeError) {
    logError('redeem write', writeError)
    return null
  }
  return data.phone
}

/** The patient sent /stop, or blocked the bot. Either way: stop messaging them. */
export async function stopReminders(chatId: number): Promise<string | null> {
  if (!usingDatabase()) return null
  const { data, error } = await db()
    .from('web_telegram')
    .update({ stopped: true, updated_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .select('phone')
    .maybeSingle<{ phone: string }>()
  if (error) {
    logError('stop', error)
    return null
  }
  return data?.phone ?? null
}

export async function stopRemindersFor(phone: string): Promise<void> {
  if (!usingDatabase()) return
  const { error } = await db()
    .from('web_telegram')
    .update({ stopped: true, updated_at: new Date().toISOString() })
    .eq('phone', phone)
  if (error) logError('stop by phone', error)
}

// ---------------------------------------------------------------------------
// Who to message, and what has gone already
// ---------------------------------------------------------------------------

export type Recipient = {
  readonly phone: string
  readonly chatId: number
}

/**
 * Everyone with a working Telegram link.
 *
 * Deliberately not filtered by date here. Which of these is actually due is a
 * question about their plan, and the plan is derived from the procedure date in
 * `domain/prep.ts` -- putting a date window in SQL would be a second, silently
 * diverging copy of that logic.
 *
 * This is fine at pilot scale. A cohort large enough for it not to be would
 * want the procedure date joined in and a window applied, and the comment above
 * is the reason to be careful when doing it.
 */
export async function reminderRecipients(): Promise<Recipient[]> {
  if (!usingDatabase()) return []
  const { data, error } = await db()
    .from('web_telegram')
    .select('phone, chat_id')
    .eq('stopped', false)
    .not('chat_id', 'is', null)
    .returns<{ phone: string; chat_id: number }[]>()
  if (error) {
    logError('recipients', error)
    return []
  }
  return (data ?? []).map((row) => ({ phone: row.phone, chatId: row.chat_id }))
}

export async function alreadySent(phone: string): Promise<Set<string>> {
  if (!usingDatabase()) return new Set()
  const { data, error } = await patientScope(phone)
    .select<{ key: string }>('web_reminders_sent', 'key')
  if (error) {
    logError('sent log read', error)
    // Failing closed: an unreadable log means we cannot tell what has gone, and
    // messaging a patient twice at 2am is worse than not messaging them.
    return new Set(['__unreadable__'])
  }
  return new Set((data ?? []).map((row) => row.key))
}

/**
 * Record a send.
 *
 * Written *before* the message goes out, and the insert is what claims the
 * slot: two cron runs overlapping would both read an empty log and both send.
 * A primary-key collision here means someone else already has it, so this run
 * stays quiet. Returns whether this run won the claim.
 */
export async function claimSend(phone: string, key: string): Promise<boolean> {
  if (!usingDatabase()) return false
  const { error } = await db().from('web_reminders_sent').insert({ phone, key })
  if (error) {
    // 23505 is unique_violation: already claimed, which is the expected path.
    if ((error as { code?: string }).code !== '23505') logError('claim send', error)
    return false
  }
  return true
}

/** Undo a claim whose send then failed, so the next run tries again. */
export async function releaseSend(phone: string, key: string): Promise<void> {
  if (!usingDatabase()) return
  const { error } = await db().from('web_reminders_sent').delete().eq('phone', phone).eq('key', key)
  if (error) logError('release send', error)
}
