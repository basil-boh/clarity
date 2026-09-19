import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'

/**
 * The session.
 *
 * A signed, httpOnly cookie holding one claim: the normalised phone number the
 * patient proved they control. Nothing clinical is in the token -- the patient
 * record is fetched server-side on every request -- so a leaked cookie exposes
 * a phone number, not a medical history.
 */

const COOKIE = 'clarity_session'
const MAX_AGE = 60 * 60 * 12 // a prep runs overnight; 12h covers the purge night

function secret(): Uint8Array {
  const raw = process.env.SESSION_SECRET
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is not set. Generate one: openssl rand -base64 32')
    }
    // Dev only, and stable across reloads so a session survives a hot restart.
    return new TextEncoder().encode('clarity-dev-secret-not-for-production-use')
  }
  return new TextEncoder().encode(raw)
}

export type Session = { phone: string }

export async function createSession(phone: string): Promise<void> {
  const token = await new SignJWT({ phone })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function readSession(): Promise<Session | null> {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    const phone = payload.phone
    return typeof phone === 'string' ? { phone } : null
  } catch {
    return null
  }
}

/**
 * The session, or a redirect to sign-in -- for pages, not only the layout.
 *
 * Next.js renders a layout and its page in parallel, so the redirect in the
 * `(patient)` layout does not stop the page from running. Pages that assumed
 * the layout had already checked ran with no session and threw on every
 * signed-out visit; each one now checks for itself.
 */
export async function requireSession(): Promise<Session> {
  const session = await readSession()
  if (!session) redirect('/sign-in')
  return session
}

export async function clearSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}
