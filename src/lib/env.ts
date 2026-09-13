import { z } from 'zod';

/**
 * Client configuration.
 *
 * ── What may live here, and what may never ─────────────────────────────────
 *
 * Everything in this file is read from `EXPO_PUBLIC_*`, which Metro inlines
 * into the JavaScript bundle at build time. That bundle ships to the device.
 * Anyone with the app can read it: `strings` on the binary is enough, no
 * jailbreak, no reverse engineering. So the rule is not "keep secrets out of
 * source control", it is **keep secrets out of the client at all**.
 *
 * The Supabase anon key is the one credential that belongs here, and it is safe
 * for exactly one reason: it is not an authorisation. Every request it makes is
 * still evaluated against Row Level Security using the caller's own JWT, so a
 * stolen anon key grants precisely what an anonymous visitor already has. That
 * is the design.
 *
 * The OpenAI key is the opposite. It *is* an authorisation: it authorises
 * spending against the project's account, with no per-user scoping and no
 * server in between. It lives in the `chat` Edge Function's secrets
 * (`supabase secrets set OPENAI_API_KEY=…`) and is never sent to the device.
 * See `supabase/functions/chat/index.ts`.
 *
 * The same goes for `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS entirely.
 */

const schema = z.object({
  supabaseUrl: z.string().url().optional(),
  supabaseAnonKey: z.string().min(1).optional(),
});

const parsed = schema.safeParse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success && __DEV__) {
  console.warn('[env] Supabase configuration is malformed:', parsed.error.flatten().fieldErrors);
}

const values = parsed.success ? parsed.data : {};

/**
 * Whether a backend is configured at all.
 *
 * Deliberately not fatal when it is not. The repositories fall back to
 * fixtures, so `npx expo start` works on a fresh clone with no `.env` and no
 * Supabase project, which is what makes this thing demoable. `isBackendReady`
 * is how each repository decides, and every one of them says so in its own
 * doc comment rather than failing silently.
 */
export const env = {
  supabaseUrl: values.supabaseUrl ?? '',
  supabaseAnonKey: values.supabaseAnonKey ?? '',
  isBackendReady: Boolean(values.supabaseUrl && values.supabaseAnonKey),
} as const;
