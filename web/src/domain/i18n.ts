/**
 * The four languages, and how a language is chosen.
 *
 * Singapore's four official languages, which is the same list the department
 * prints its leaflets in. `Language` itself lives in `domain/prep.ts` because
 * the patient profile carried it long before anything was translated; this
 * module is what finally reads it.
 *
 * Every language is named in its own script. A patient looking for Tamil is
 * looking for "தமிழ்", not for the English word "Tamil" -- if they could read
 * the English they would not be changing the language.
 */

import type { Language } from './prep'

export type { Language }

export const LANGUAGES = ['en', 'zh', 'ms', 'ta'] as const

export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
  en: 'English',
  zh: '中文',
  ms: 'Bahasa Melayu',
  ta: 'தமிழ்',
}

/**
 * Each name in its own script.
 *
 * Keep language choices recognisable in any selected interface language.
 */
export const LANGUAGE_LABELS: Readonly<Record<Language, string>> = {
  en: 'English',
  zh: '中文',
  ms: 'Bahasa Melayu',
  ta: 'தமிழ்',
}

/** The `lang` attribute for the document, which decides font and hyphenation. */
export const HTML_LANG: Readonly<Record<Language, string>> = {
  en: 'en-SG',
  zh: 'zh-Hans-SG',
  ms: 'ms-SG',
  ta: 'ta-SG',
}

export const DEFAULT_LANGUAGE: Language = 'en'

/** A language from anywhere -- a cookie, a form post, a database row. */
export function asLanguage(value: unknown): Language | null {
  return (LANGUAGES as readonly unknown[]).includes(value) ? (value as Language) : null
}

/** Never throws and never guesses: anything unrecognised reads as English. */
export function languageOr(value: unknown, fallback: Language = DEFAULT_LANGUAGE): Language {
  return asLanguage(value) ?? fallback
}

/** Fixed system-prompt values; never interpolate an unvalidated request value. */
export const RESPONSE_LANGUAGES: Record<Language, string> = {
  en: 'English', zh: 'Simplified Chinese', ms: 'Malay', ta: 'Tamil',
}
