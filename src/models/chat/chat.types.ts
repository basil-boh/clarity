export type ChatRole = 'patient' | 'assistant';

export type ChatMessage = {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  /** The assistant judged this needed a person, not an answer. */
  readonly escalated: boolean;
  readonly createdAt: string;
};

export type ChatReply = {
  readonly reply: string;
  readonly escalated: boolean;
  /** Set when the server replaced a reply that breached one of the two rules. */
  readonly blocked: string | null;
};
