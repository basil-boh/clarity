import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * The database connection, and the one place the service role key is held.
 *
 * ── Why the service role, when the Expo app uses the anon key ──────────────
 *
 * The Expo app hands the device a Supabase JWT, so Row Level Security can do
 * the authorisation: every policy in `0001_init.sql` is `auth.uid() = patient_id`
 * and a compromised client still only reaches its own rows.
 *
 * This app has no Supabase user to key a policy on. A patient proves they hold
 * a mobile number via Twilio Verify and gets a signed `httpOnly` cookie from
 * this server; there is no JWT to pass down, and minting one would mean running
 * a second identity system alongside the one that already works.
 *
 * So the boundary moves rather than disappearing:
 *
 * - The `web_*` tables have RLS enabled and **no policies**, which in Postgres
 *   means deny. `anon` and `authenticated` are revoked on top. Nothing reaches
 *   them except the service role.
 * - **No Supabase credential is sent to the browser.** Nothing client-side in
 *   this app imports this module -- `server-only` above makes that a build
 *   error rather than a code review -- and there is no `NEXT_PUBLIC_` Supabase
 *   variable to leak.
 * - **Every query filters by the phone number in the verified session.** That
 *   is now the authorisation, and it is load-bearing: a query that forgets its
 *   `.eq('phone', …)` returns the whole ward. `patientScope()` below exists so
 *   that filter is applied by construction rather than remembered.
 *
 * The cost is honest: a leaked service role key is every patient's record, and
 * `.env.local` is the thing to protect. The Expo app's anon key is not.
 */

function url(): string | undefined {
  return process.env.SUPABASE_URL
}

function serviceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY
}

/** Whether a real database is configured, as opposed to the demo fixture. */
export function supabaseConfigured(): boolean {
  return Boolean(url() && serviceKey())
}

let cached: SupabaseClient | null = null

/**
 * The client.
 *
 * Cached across requests because creating one per request is wasteful and the
 * client holds no per-user state -- there is no session to confuse between
 * patients, precisely because it authenticates as the service role and the
 * patient is a `where` clause.
 */
export function db(): SupabaseClient {
  if (cached) return cached
  const u = url()
  const k = serviceKey()
  if (!u || !k) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, ' +
        'or leave PATIENT_SOURCE unset to run on the demo fixture.',
    )
  }
  cached = createClient(u, k, {
    // There is no user session and no token to refresh: this client is the
    // server talking to its own database. Persisting anything would be a
    // cross-request leak waiting to happen.
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-application-name': 'clarity-web' } },
  })
  return cached
}

/**
 * A query builder already narrowed to one patient.
 *
 * The whole security model of this app is "every query filters by the session's
 * phone number". Writing that filter by hand at each call site means it can be
 * left off at exactly one of them, and the failure mode is silent and total.
 * Going through here makes the filter part of getting the table at all.
 */
export function patientScope(phone: string) {
  const client = db()
  return {
    /**
     * A `select` already narrowed to this patient. Columns are named rather
     * than defaulted to `*` so that adding a column to a table does not
     * silently start shipping it to a screen.
     */
    select<Row = Record<string, unknown>>(table: string, columns: string) {
      return client.from(table).select(columns).eq('phone', phone).returns<Row[]>()
    },
    /**
     * The raw client, for writes. A write cannot be scoped the same way -- the
     * phone belongs in the payload -- so those call sites set it explicitly and
     * are the ones to read twice.
     */
    client,
    phone,
  }
}

/**
 * Supabase errors, logged once and turned into something a screen can handle.
 *
 * Deliberately does **not** swallow the error into an empty result: a patient
 * shown an empty plan because the database was unreachable would reasonably
 * conclude their appointment was cancelled. Reads that can degrade say so at
 * the call site; this only makes the log line consistent.
 */
export function logDbError(where: string, error: unknown): void {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)
  console.error(`[clarity] supabase ${where}: ${message}`)
}
