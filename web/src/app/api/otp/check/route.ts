import { NextResponse } from 'next/server'

import { checkCode } from '@/lib/otp'
import { findPatient } from '@/lib/patients'
import { writeLanguage } from '@/lib/language'
import { normalisePhone } from '@/lib/phone'
import { createSession } from '@/lib/session'

/**
 * Check a one-time code and open a session.
 *
 * A correct code always opens a session, even for a number with no record. The
 * alternative is to reject it, which would tell the caller that this number has
 * no colonoscopy booked -- and they have just proved they hold the phone, so
 * the honest thing is to let them in and show them an empty plan.
 */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const { phone: rawPhone, code } = (body ?? {}) as { phone?: unknown; code?: unknown }
  if (typeof rawPhone !== 'string' || typeof code !== 'string') {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const phone = normalisePhone(rawPhone)
  if (!phone.ok) return NextResponse.json({ error: phone.error }, { status: 400 })

  const checked = await checkCode(phone.e164, code)
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 401 })

  await createSession(phone.e164)

  const patient = await findPatient(phone.e164)

  // A patient who has been here before gets the app in the language they chose,
  // on whatever phone they are holding -- the cookie may be new, the preference
  // is not.
  if (patient) await writeLanguage(patient.profile.language)

  // Nothing on file means the details have not been entered yet, so that is
  // where they go. It is no longer a dead end: this app has no department
  // behind it, and the welcome form is how a record comes to exist at all.
  const next = patient ? '/today' : '/welcome'
  return NextResponse.json({ ok: true, known: patient !== null, next })
}
