import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

import type { ChatMessage, ChatReply } from './chat.types';

/**
 * The assistant, from the client's side.
 *
 * There is no model call in this file and there must never be one. The OpenAI
 * key lives in the `chat` Edge Function's secrets; the device sends a question
 * and its JWT and receives text. If you find yourself reaching for
 * `fetch('https://api.openai.com/...')` here, that is the bug: see the note at
 * the top of `lib/env.ts`.
 */

const OFFLINE_REPLY =
  'The assistant is not connected yet. Once Supabase is configured and the `chat` ' +
  'function is deployed, this answers from your own plan, and always tells you when ' +
  'to speak to a person instead.';

export async function askAssistant(question: string): Promise<ChatReply> {
  if (!env.isBackendReady || supabase === null) {
    return { reply: OFFLINE_REPLY, escalated: false, blocked: null };
  }

  // `invoke` attaches the caller's session automatically, which is what the
  // function uses to read this patient's context under their own RLS.
  const { data, error } = await supabase.functions.invoke<ChatReply>('chat', {
    body: { question },
  });

  if (error) throw error;
  if (!data?.reply) throw new Error('The assistant returned nothing.');
  return data;
}

/**
 * The thread so far.
 *
 * Read-only by policy: both sides are written by the Edge Function under the
 * service role, so a patient cannot forge an assistant message that appears to
 * authorise a second dose.
 */
export async function fetchThread(): Promise<ChatMessage[]> {
  if (!env.isBackendReady || supabase === null) return [];

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    escalated: row.escalated,
    createdAt: row.created_at,
  }));
}
