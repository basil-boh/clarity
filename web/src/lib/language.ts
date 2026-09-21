import 'server-only'

import { cookies } from 'next/headers'

import { DEFAULT_LANGUAGE, asLanguage, type Language } from '@/domain/i18n'
import { dictionary, type Dictionary } from '@/messages'

/**
 * Which language to render in.
 *
 * A cookie, not the patient record, is the source of truth for the *interface*.
 * Two reasons: the sign-in and welcome screens are read before there is a
 * patient to look up, and a caregiver reading the app on their own phone should
 * be able to switch it without editing the patient's saved preference.
 *
 * The saved profile is what seeds the cookie at sign-in, so a patient who
 * chose Tamil last year still gets Tamil on a new phone.
 */

const COOKIE = 'colonaid_lang'
// A preference, not a session: it should outlive the 12-hour sign-in.
const MAX_AGE = 60 * 60 * 24 * 365

/**
 * What the browser asked for, or null if it has not asked.
 *
 * Null is a real answer and not the same as English: it is what lets the
 * welcome form fall back to the language saved against the patient rather than
 * overriding it with a default nobody chose.
 */
export async function readLanguagePreference(): Promise<Language | null> {
  const jar = await cookies()
  return asLanguage(jar.get(COOKIE)?.value)
}

export async function readLanguage(): Promise<Language> {
  return (await readLanguagePreference()) ?? DEFAULT_LANGUAGE
}

export async function writeLanguage(language: Language): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE, language, {
    // Read by the language picker in the browser, so not httpOnly. It is a
    // display preference -- there is nothing here worth protecting.
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

/** The language and its copy in one read, for a server component. */
export async function translation(): Promise<{ language: Language; t: Dictionary }> {
  const language = await readLanguage()
  return { language, t: dictionary(language) }
}
