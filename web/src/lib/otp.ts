import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { usingDatabase } from '@/lib/source'
import { db, logDbError } from '@/lib/supabase'
import { normalisePhone, phoneTail } from './phone'

/**
 * One-time codes over SMS.
 *
 * Twilio Verify is used rather than raw Programmable SMS on purpose: Verify
 * owns code generation, expiry, attempt limits and replay, which is the part of
 * an OTP flow that is easy to get subtly wrong. What is left here is the part
 * that is genuinely ours -- the resend cooldown, and turning Twilio's statuses
 * into sentences a patient can act on.
 *
 * **Nothing here is held in memory between requests.** An earlier draft kept the
 * cooldown and the demo codes in module-level Maps, which broke in two ways: in
 * `next dev` the two route handlers do not reliably share a module instance, so
 * a code issued by /api/otp/start was unknown to /api/otp/check; and on any
 * multi-instance deployment the cooldown would quietly stop limiting anything.
 * Demo codes are derived rather than stored, and the cooldown is held in
 * Postgres -- or in a signed cookie when no database is configured.
 */

function config() {
  return {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    service: process.env.TWILIO_VERIFY_SERVICE_SID,
    resend: Number(process.env.OTP_RESEND_SECONDS ?? 60),
  }
}

export function twilioConfigured(): boolean {
  const { sid, token, service } = config()
  return Boolean(sid && token && service)
}

/** Demo mode prints the code to the console. Never reachable in production. */
export function isDemoMode(): boolean {
  return !twilioConfigured() && process.env.NODE_ENV !== 'production'
}

/**
 * Numbers that skip Twilio even when Twilio is switched on.
 *
 * The problem this solves is a Twilio **trial** account, which will only deliver
 * an SMS to a number verified in the Twilio console. That is usually one phone —
 * the developer's. Everything else can be typed into the sign-in form but the
 * code never arrives, and a correct code is the only way past the form. So a
 * demo runs on exactly one number, or Twilio has to be switched off entirely and
 * the real send path stops being exercised at all.
 *
 * `DEMO_PHONES` is a comma-separated list that takes the demo path — code
 * printed to the server console, no SMS — while every other number still goes
 * through Twilio for real. One build demonstrates both halves.
 *
 * ── Three things keep this from becoming a back door ───────────────────────
 *
 * 1. **It does not exist in production.** The list is empty when
 *    `NODE_ENV === 'production'`, whatever the variable says, so a deploy that
 *    carries the variable by accident is not a deploy with a bypass in it.
 * 2. **It is opt-in and explicit.** No number is on this path unless someone
 *    typed it into an environment variable. There is no default list.
 * 3. **The code is still a real code.** It is the same HMAC-derived, rotating
 *    6 digits as full demo mode, checked the same way. This skips the *carrier*,
 *    not the verification -- a wrong code is still refused, so the flow being
 *    demonstrated is the flow that ships.
 *
 * It is still a bypass, and it is still logged loudly every time it fires.
 */
export function demoPhoneList(): string[] {
  if (process.env.NODE_ENV === 'production') return []

  const raw = process.env.DEMO_PHONES
  if (!raw) return []

  const out: string[] = []
  for (const entry of raw.split(',')) {
    const trimmed = entry.trim()
    if (!trimmed) continue
    // Normalised with the same function the sign-in form uses, so the list can
    // be written as "9123 4567" and still match a patient who typed
    // "+65 91234567". An entry that cannot be normalised is dropped loudly
    // rather than silently never matching.
    const parsed = normalisePhone(trimmed)
    if (parsed.ok) out.push(parsed.e164)
    else console.warn(`[clarity] DEMO_PHONES: ignoring "${trimmed}" — ${parsed.error}`)
  }
  return out
}

export function isDemoPhone(phone: string): boolean {
  return demoPhoneList().includes(phone)
}

/** Whether this number takes the console-code path, for either reason. */
function usesDemoCode(phone: string): boolean {
  return isDemoMode() || isDemoPhone(phone)
}

/** Production with no Twilio: refuse, rather than silently accept any code. */
function misconfigured(): boolean {
  return !twilioConfigured() && process.env.NODE_ENV === 'production'
}

export function resendSeconds(): number {
  return config().resend
}

function secret(): string {
  const raw = process.env.SESSION_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is not set. Generate one: openssl rand -base64 32')
    }
    return 'clarity-dev-secret-not-for-production-use'
  }
  return raw
}

// ---------------------------------------------------------------------------
// Resend cooldown
// ---------------------------------------------------------------------------

const COOLDOWN_COOKIE = 'clarity_otp_sent'

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url')
}

function equal(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export type Cooldown = { ok: true } | { ok: false; retryAfter: number }

/**
 * The per-device half: a signed cookie.
 *
 * A cookie is not a per-number limit -- clearing it asks for another code -- so
 * this is no longer the only control. It stays because it costs one HMAC, it
 * works with no database at all, and it is what stops the ordinary double-tap
 * without a round trip to Postgres.
 */
async function checkCookieCooldown(phone: string): Promise<Cooldown> {
  const jar = await cookies()
  const raw = jar.get(COOLDOWN_COOKIE)?.value
  if (!raw) return { ok: true }

  const [payload, mac] = raw.split('.')
  if (!payload || !mac || !equal(mac, sign(payload))) return { ok: true }

  const [cookiePhone, sentAt] = Buffer.from(payload, 'base64url').toString().split('|')
  if (cookiePhone !== phone) return { ok: true }

  const elapsed = (Date.now() - Number(sentAt)) / 1000
  const limit = config().resend
  if (!Number.isFinite(elapsed) || elapsed >= limit) return { ok: true }
  return { ok: false, retryAfter: Math.max(1, Math.ceil(limit - elapsed)) }
}

async function markSent(phone: string): Promise<void> {
  const payload = Buffer.from(`${phone}|${Date.now()}`).toString('base64url')
  const jar = await cookies()
  jar.set(COOLDOWN_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: config().resend,
  })
}

/**
 * The per-number half: one row per number in Postgres.
 *
 * This is the limit that actually holds. It is keyed on the number rather than
 * the browser, so clearing cookies, opening a private window or picking up a
 * second phone all land on the same row.
 *
 * It is a **claim**, not a question: `web_otp_claim` does the check and the
 * write in one statement. Reading and then writing would let two taps a few
 * milliseconds apart both see an expired window and both send.
 *
 * Returns null when there is no database, or when the call failed -- the caller
 * then falls back to the cookie. Failing open is deliberate: the consequence is
 * that someone can ask for codes as fast as they can clear cookies, and Twilio
 * Verify's own per-number limits are the backstop for exactly that. The
 * consequence of failing closed is a patient locked out of their prep
 * instructions at 1am because a database was briefly unreachable.
 */
async function claimSendInDatabase(phone: string): Promise<Cooldown | null> {
  if (!usingDatabase()) return null
  try {
    const { data, error } = await db().rpc('web_otp_claim', {
      p_phone: phone,
      p_cooldown: config().resend,
    })
    if (error) {
      logDbError('web_otp_claim', error)
      return null
    }
    const wait = Number(data)
    if (!Number.isFinite(wait)) return null
    return wait <= 0 ? { ok: true } : { ok: false, retryAfter: wait }
  } catch (err) {
    logDbError('web_otp_claim', err)
    return null
  }
}

/**
 * Take a send slot for this number, or say how long to wait.
 *
 * The database slot is consumed *before* Twilio is called, so a Twilio failure
 * still costs the patient the cooldown. That is the right way round: a failing
 * Twilio will fail again immediately, and releasing the claim would turn an
 * outage into an unbounded retry loop against a paid API.
 */
async function claimSend(phone: string): Promise<Cooldown> {
  const cookie = await checkCookieCooldown(phone)
  const database = await claimSendInDatabase(phone)

  // Where the database answered it is authoritative: it has already consumed
  // the slot, and honouring a stale cookie on top would refuse a send that has
  // just been paid for.
  const verdict = database ?? cookie
  if (verdict.ok) await markSent(phone)
  return verdict
}

// ---------------------------------------------------------------------------
// Demo mode
// ---------------------------------------------------------------------------

/** Codes roll every 5 minutes; the previous window stays valid, so one lasts 5-10. */
const DEMO_WINDOW_S = 300

function demoCodeFor(phone: string, window: number): string {
  const mac = createHmac('sha256', secret()).update(`demo:${phone}:${window}`).digest()
  return String(mac.readUInt32BE(0) % 1_000_000).padStart(6, '0')
}

function currentDemoCode(phone: string): string {
  return demoCodeFor(phone, Math.floor(Date.now() / 1000 / DEMO_WINDOW_S))
}

function demoCodeValid(phone: string, code: string): boolean {
  const now = Math.floor(Date.now() / 1000 / DEMO_WINDOW_S)
  return code === demoCodeFor(phone, now) || code === demoCodeFor(phone, now - 1)
}

// ---------------------------------------------------------------------------
// Twilio
// ---------------------------------------------------------------------------

type TwilioClient = ReturnType<typeof import('twilio')>
let client: TwilioClient | null = null

async function twilio(): Promise<TwilioClient> {
  if (client) return client
  const { default: Twilio } = await import('twilio')
  const { sid, token } = config()
  client = Twilio(sid!, token!)
  return client
}

export type SendResult =
  | { ok: true; demo: boolean; sentTo: string }
  | { ok: false; error: string; retryAfter?: number }

export async function sendCode(phone: string): Promise<SendResult> {
  // Refuse before claiming a slot: a misconfigured deployment should not be
  // burning cooldowns for codes it was never going to send.
  if (misconfigured()) {
    console.error('[clarity] Twilio is not configured; refusing to send a code.')
    return { ok: false, error: 'Sign-in is unavailable right now. Please call the department.' }
  }

  const cooldown = await claimSend(phone)
  if (!cooldown.ok) {
    return {
      ok: false,
      retryAfter: cooldown.retryAfter,
      error: `Please wait ${cooldown.retryAfter}s before asking for another code.`,
    }
  }

  if (usesDemoCode(phone)) {
    // Loud, and names which of the two reasons applies: a line saying no SMS was
    // sent is the only thing standing between "the demo works" and "sign-in is
    // broken for this number and nobody noticed".
    const why = isDemoMode() ? 'DEMO MODE' : 'DEMO NUMBER (DEMO_PHONES) -- no SMS sent'
    console.info(`\n  [clarity] ${why} -- code for ${phone} is ${currentDemoCode(phone)}\n`)
    return { ok: true, demo: true, sentTo: phoneTail(phone) }
  }

  try {
    const api = await twilio()
    await api.verify.v2
      .services(config().service!)
      .verifications.create({ to: phone, channel: 'sms' })
    return { ok: true, demo: false, sentTo: phoneTail(phone) }
  } catch (err) {
    const code = (err as { code?: number })?.code
    // 60200 invalid parameter, 60203 max send attempts, 60205 unsupported landline
    if (code === 60200) return { ok: false, error: 'That does not look like a mobile number.' }
    if (code === 60203) {
      return { ok: false, error: 'Too many codes requested. Try again in a few minutes.' }
    }
    if (code === 60205) return { ok: false, error: 'That number cannot receive SMS.' }
    console.error('[clarity] Twilio send failed', err)
    return { ok: false, error: 'We could not send the code. Please try again.' }
  }
}

export type CheckResult = { ok: true } | { ok: false; error: string }

export async function checkCode(phone: string, code: string): Promise<CheckResult> {
  const clean = (code ?? '').replace(/\D/g, '')
  if (clean.length !== 6) return { ok: false, error: 'Enter the 6-digit code.' }

  if (misconfigured()) {
    return { ok: false, error: 'Sign-in is unavailable right now. Please call the department.' }
  }

  if (usesDemoCode(phone)) {
    if (!demoCodeValid(phone, clean)) return { ok: false, error: 'That code is not right.' }
    return { ok: true }
  }

  try {
    const api = await twilio()
    const check = await api.verify.v2
      .services(config().service!)
      .verificationChecks.create({ to: phone, code: clean })
    if (check.status === 'approved') return { ok: true }
    return { ok: false, error: 'That code is not right.' }
  } catch (err) {
    const code = (err as { code?: number })?.code
    // 20404: the verification is gone -- expired, or already approved.
    if (code === 20404) return { ok: false, error: 'That code has expired. Ask for a new one.' }
    if (code === 60202) {
      return { ok: false, error: 'Too many wrong attempts. Ask for a new code.' }
    }
    console.error('[clarity] Twilio check failed', err)
    return { ok: false, error: 'We could not check the code. Please try again.' }
  }
}
