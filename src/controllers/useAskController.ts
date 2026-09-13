import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { askAssistant, fetchThread } from '@/models/chat/chat.repository';
import type { ChatMessage } from '@/models/chat/chat.types';

/**
 * The 24/7 assistant.
 *
 * The patient's own message is appended locally the instant they send it, so
 * the thread never appears to swallow a question while the request is in
 * flight. The server is still the record: both sides are written by the Edge
 * Function, and `fetchThread` is the truth on the next load.
 *
 * `error` is surfaced rather than swallowed into a fake reply. An assistant
 * that answers "sorry, something went wrong" in the same bubble style as a real
 * answer teaches patients to trust the bubbles, which is the opposite of what
 * this screen needs at 1am.
 */
export function useAskController() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<ChatMessage[]>([]);

  const thread = useQuery({ queryKey: ['chat'], queryFn: fetchThread });

  const ask = useMutation({
    mutationFn: (question: string) => askAssistant(question),
    onSettled: () => {
      setPending([]);
      void queryClient.invalidateQueries({ queryKey: ['chat'] });
    },
  });

  function send(text: string) {
    const question = text.trim();
    if (!question || ask.isPending) return;

    setPending([
      {
        id: `local-${Date.now()}`,
        role: 'patient',
        content: question,
        escalated: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    ask.mutate(question);
  }

  const messages: ChatMessage[] = [...(thread.data ?? []), ...pending];

  // The last reply, when the server had to replace it for breaching one of the
  // two rules. The screen says so rather than passing it off as an answer.
  const blockedRule = ask.data?.blocked ?? null;

  return {
    messages,
    send,
    isThinking: ask.isPending,
    error: ask.error,
    blockedRule,
  };
}
