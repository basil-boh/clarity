import { NextResponse } from 'next/server'

import { sendCode } from '@/lib/otp'
import { normalisePhone } from '@/lib/phone'

/**
 * Send a one-time code.
 *
 * Answers the same way whether or not the number belongs to a patient. Telling
 * an anonymous caller "no such patient" would turn this endpoint into a way to
 * ask whether a given mobile number has a colonoscopy booked, which is a
 * medical fact about a named person. The lookup happens after the code is
 * checked, and an unknown number simply finds nothing waiting for it.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const raw = (body as { phone?: unknown })?.phone
  if (typeof raw !== 'string') {
    return NextResponse.json({ error: 'Enter your mobile number.' }, { status: 400 })
  }

  const phone = normalisePhone(raw)
  if (!phone.ok) return NextResponse.json({ error: phone.error }, { status: 400 })

  const sent = await sendCode(phone.e164)
  if (!sent.ok) {
    return NextResponse.json(
      { error: sent.error, retryAfter: sent.retryAfter },
      { status: sent.retryAfter ? 429 : 502 },
    )
  }

  return NextResponse.json({ ok: true, sentTo: sent.sentTo, demo: sent.demo })
}
