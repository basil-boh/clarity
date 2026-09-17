/**
 * Phone numbers, normalised to E.164 once, at the edge.
 *
 * Everything downstream -- the rate limiter, the Twilio call, the patient
 * lookup, the session -- keys off the normalised string, so a patient who types
 * "9123 4567" on Monday and "+65 91234567" on Tuesday is one person.
 *
 * Singapore is the default country because the deployment is a Singapore public
 * hospital, but a number typed with its own `+` prefix is left alone.
 */

const SG_MOBILE = /^[89]\d{7}$/

export type PhoneResult = { ok: true; e164: string } | { ok: false; error: string }

export function normalisePhone(raw: string): PhoneResult {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return { ok: false, error: 'Enter your mobile number.' }

  // Keep a leading +, drop every other non-digit: spaces, dashes, brackets.
  const plus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return { ok: false, error: 'Enter your mobile number.' }

  if (plus) {
    if (digits.length < 8 || digits.length > 15) {
      return { ok: false, error: 'That does not look like a mobile number.' }
    }
    return { ok: true, e164: `+${digits}` }
  }

  // Local Singapore forms: 91234567, or 6591234567 with the country code typed
  // but no plus.
  if (SG_MOBILE.test(digits)) return { ok: true, e164: `+65${digits}` }
  if (digits.length === 10 && digits.startsWith('65') && SG_MOBILE.test(digits.slice(2))) {
    return { ok: true, e164: `+${digits}` }
  }

  return {
    ok: false,
    error: 'Enter an 8-digit Singapore mobile number, or the full number with +.',
  }
}

/** For display: +6591234567 -> +65 9123 4567. Never used as a key. */
export function formatPhone(e164: string): string {
  if (e164.startsWith('+65') && e164.length === 11) {
    return `+65 ${e164.slice(3, 7)} ${e164.slice(7)}`
  }
  return e164
}

/** Last two digits only, for "we sent a code to the number ending 67". */
export function phoneTail(e164: string): string {
  return e164.slice(-2)
}
