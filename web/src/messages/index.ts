import type { Language } from '@/domain/i18n'
import { DEFAULT_LANGUAGE } from '@/domain/i18n'

import { en, type Dictionary } from './en'
import { ms } from './ms'
import { ta } from './ta'
import { zh } from './zh'

export type { Dictionary }

/**
 * Every language, eagerly.
 *
 * Not dynamically imported on purpose. The whole point of the language picker
 * is that the screen changes *as the patient chooses*, with no round trip and
 * no spinner -- someone who cannot read the current language has no way to
 * understand a loading state. Four small objects are a cheap price for that.
 *
 * This is also why the catalogues hold interface copy only. The food dataset
 * and the prep instructions are large and are translated where they are read,
 * so they never reach a phone that is not showing them.
 */
export const DICTIONARIES: Readonly<Record<Language, Dictionary>> = { en, zh, ms, ta }

export function dictionary(language: Language): Dictionary {
  return DICTIONARIES[language] ?? DICTIONARIES[DEFAULT_LANGUAGE]
}
