/**
 * Conversation openers shown before the patient has sent a message.
 *
 * They live in the model layer so the view renders a shared catalogue and the
 * safety suite can verify every real suggestion without inspecting JSX.
 */
export const CHAT_SUGGESTIONS = [
  'Can I still drink kopi?',
  'I vomited some of the prep. What now?',
  'How do I know it is working?',
  'I am still passing solid stool at 1am',
] as const;
