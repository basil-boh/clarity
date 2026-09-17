import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { phoneTail } from './phone'

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
 * The cooldown now lives in a signed cookie, and demo codes are derived rather
 * than stored, so both survive a cold start and a different instance.
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
 * Per-device, by design.
 *
 * A cookie is not a per-number limit: clearing it asks for another code. It
 * stops the ordinary double-tap, and Twilio Verify's own per-number limits are
 * the backstop against someone deliberately hammering a number. A real
 * per-number limit needs shared storage, and that is the one thing to add here
 * when a database exists -- the shape of this function does not change.
 */
export async function checkCooldown(phone: string): Promise<Cooldown> {
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
  const cooldown = await checkCooldown(phone)
  if (!cooldown.ok) {
    return {
      ok: false,
      retryAfter: cooldown.retryAfter,
      error: `Please wait ${cooldown.retryAfter}s before asking for another code.`,
    }
  }

  if (misconfigured()) {
    console.error('[clarity] Twilio is not configured; refusing to send a code.')
    return { ok: false, error: 'Sign-in is unavailable right now. Please call the department.' }
  }

  if (isDemoMode()) {
    await markSent(phone)
    console.info(`\n  [clarity] DEMO MODE -- code for ${phone} is ${currentDemoCode(phone)}\n`)
    return { ok: true, demo: true, sentTo: phoneTail(phone) }
  }

  try {
    const api = await twilio()
    await api.verify.v2
      .services(config().service!)
      .verifications.create({ to: phone, channel: 'sms' })
    await markSent(phone)
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

  if (isDemoMode()) {
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
