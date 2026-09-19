import 'server-only'

import { usingDatabase } from '@/lib/source'
import { db, logDbError } from '@/lib/supabase'

/**
 * The assistant's transcript.
 *
 * What is on screen is component state and stays there: the conversation is not
 * sent back to the browser and is not restored on reload, because writing a
 * medical conversation into a cookie would put it on disk on a shared family
 * phone.
 *
 * What is written here is server-side, for the ward rather than the patient.
 * `escalated` is how a department finds out whether the assistant actually told
 * someone to call when it should have, and `blocked_rule` records which of the
 * two `NEVER` rules replaced a reply. A guardrail nobody can audit is a claim,
 * not a control -- `web_chat_messages` is what makes it checkable after the
 * fact, and the escalation index in the migration is the query it exists for.
 *
 * Both sides of the exchange are written together so a reply can never be
 * attributed to the assistant without the question that produced it.
 */
export async function recordExchange(args: {
  phone: string
  question: string
  reply: string
  escalated: boolean
  blockedRule?: string | null
}): Promise<void> {
  if (!usingDatabase()) return

  try {
    const { error } = await db()
      .from('web_chat_messages')
      .insert([
        { phone: args.phone, role: 'patient', content: args.question },
        {
          phone: args.phone,
          role: 'assistant',
          content: args.reply,
          escalated: args.escalated,
          blocked_rule: args.blockedRule ?? null,
        },
      ])
    // Best effort, and only here. A failed write must not cost the patient the
    // answer they are waiting on at 1am -- the transcript is an audit trail,
    // not the feature. It is also the one place a write is allowed to fail
    // quietly; `progress-store.ts` deliberately does the opposite, because
    // there the patient is told their prep was recorded.
    if (error) logDbError('web_chat_messages insert', error)
  } catch (err) {
    logDbError('web_chat_messages insert', err)
  }
}
