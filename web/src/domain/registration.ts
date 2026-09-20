import { addYears, differenceInCalendarDays, isValid, parseISO } from 'date-fns'

import { DEFAULT_LANGUAGE, languageOr, type Language } from './i18n.ts'
import { todayIn } from './prep.ts'

/**
 * What a patient tells us about themselves, and what makes it usable.
 *
 * This app is not wired to a hospital system: there is no booking to check a
 * patient against, so what they type *is* the record. That makes the date the
 * single most load-bearing value in the app -- `buildPlan` derives every diet
 * day, both doses and the arrival from it -- and the reason the checks below
 * are less permissive than they look. A typo here is a patient who starts their
 * preparation on the wrong evening.
 *
 * Failures come back as **keys**, not sentences, so the message is chosen in
 * whichever language the patient is reading. The keys match `messages/en.ts`
 * under `welcome`, and the compiler holds them together.
 */

export const MAX_NAME_LENGTH = 120
/** Beyond this a date is far likelier to be a typo than a booking. */
export const MAX_YEARS_AHEAD = 3

export type NameError = 'nameMissing'
export type DateError = 'dateMissing' | 'dateUnreadable' | 'datePast' | 'dateTooFar'

export type Registration = {
  readonly name: string
  readonly date: string
  readonly language: Language
}

export type RegistrationResult =
  | { readonly ok: true; readonly value: Registration }
  | { readonly ok: false; readonly errors: { name?: NameError; date?: DateError } }

function checkName(raw: unknown): { value: string } | { error: NameError } {
  const name = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : ''
  if (!name) return { error: 'nameMissing' }
  return { value: name.slice(0, MAX_NAME_LENGTH) }
}

function checkDate(raw: unknown, now: Date): { value: string } | { error: DateError } {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (!text) return { error: 'dateMissing' }
  // `<input type="date">` always posts `yyyy-MM-dd`, but the form can also be
  // submitted with JavaScript off and by anything else that can POST.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return { error: 'dateUnreadable' }

  const date = parseISO(text)
  // parseISO turns 31 February into 3 March rather than refusing it, which
  // would silently move someone's procedure. Check the parts came back
  // unchanged -- and check them against the *local* date, because
  // `toISOString()` on a local-midnight Date reports the previous day
  // everywhere east of Greenwich, Singapore included.
  const [year, month, day] = text.split('-').map(Number)
  const intact =
    isValid(date) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  if (!intact) return { error: 'dateUnreadable' }

  // Today counts: someone signing in on the morning of their procedure is a
  // normal thing to do, and the plan has a `procedure_day` for exactly that.
  const days = differenceInCalendarDays(date, parseISO(todayIn(now)))
  if (days < 0) return { error: 'datePast' }
  if (date > addYears(parseISO(todayIn(now)), MAX_YEARS_AHEAD)) return { error: 'dateTooFar' }

  return { value: text }
}

export function parseRegistration(
  raw: { name?: unknown; date?: unknown; language?: unknown },
  now = new Date(),
): RegistrationResult {
  const name = checkName(raw.name)
  const date = checkDate(raw.date, now)

  if ('error' in name || 'error' in date) {
    return {
      ok: false,
      errors: {
        ...('error' in name ? { name: name.error } : {}),
        ...('error' in date ? { date: date.error } : {}),
      },
    }
  }

  return {
    ok: true,
    value: {
      name: name.value,
      date: date.value,
      // An unreadable language is the one field worth defaulting rather than
      // refusing: it costs the patient nothing and English is legible to the
      // staff who would have to unpick it.
      language: languageOr(raw.language, DEFAULT_LANGUAGE),
    },
  }
}
