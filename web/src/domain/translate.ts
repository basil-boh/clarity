import { format } from 'date-fns'
import { enGB, zhCN, ms, ta } from 'date-fns/locale'
import type { Language } from './i18n.ts'
import { PATIENT_COPY } from '../messages/patient-copy.ts'
import { en } from '../messages/en.ts'
import { zh } from '../messages/zh.ts'
import { ms as malay } from '../messages/ms.ts'
import { ta as tamil } from '../messages/ta.ts'

const locales = { en: enGB, zh: zhCN, ms, ta }
const index = { zh: 0, ms: 1, ta: 2 } as const
const normalise = (value: string) => value.replace(/\s+/g, ' ').trim()
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Reuse the existing welcome/reminder catalogue, including translated server props.
const catalogues = { en, zh, ms: malay, ta: tamil }
const lookup: Record<Language, Map<string, string>> = { en: new Map(), zh: new Map(), ms: new Map(), ta: new Map() }
function collect(source: object, translated: object, map: Map<string, string>) {
  for (const [key, value] of Object.entries(source)) {
    const into = (translated as Record<string, unknown>)[key]
    if (typeof value === 'string' && typeof into === 'string') map.set(normalise(value), into)
    else if (value && typeof value === 'object' && into && typeof into === 'object') collect(value, into, map)
  }
}
for (const language of ['zh', 'ms', 'ta'] as const) {
  collect(en, catalogues[language], lookup[language])
  for (const [english, translations] of Object.entries(PATIENT_COPY)) lookup[language].set(normalise(english), translations[index[language]])
}

// Domain models retain stable English values and IDs. Translate their display
// strings here, including existing interpolated labels, never database fields.
const templates = Object.keys(PATIENT_COPY).filter(key => /\{\d+\}/.test(key)).map(key => {
  const slots: string[] = []
  const chunks = normalise(key).split(/(\{\d+\})/)
  const pattern = chunks.map(chunk => {
    if (/^\{\d+\}$/.test(chunk)) { slots.push(chunk.slice(1, -1)); return '(.+?)' }
    return escape(chunk)
  }).join('')
  return { key, slots, pattern: new RegExp(`^${pattern}$`) }
}).sort((a, b) => b.key.replace(/\{\d+\}/g, '').length - a.key.replace(/\{\d+\}/g, '').length)

export function createI18n(language: Language) {
  function text(value: string): string {
    if (language === 'en' || !value.trim()) return value
    const key = normalise(value)
    const exact = lookup[language].get(key)
    if (exact) return exact
    // Medication descriptions are assembled as separate lines by the domain.
    if (value.includes('\n')) return value.split('\n').map(text).join('\n')
    for (const template of templates) {
      const match = template.pattern.exec(key)
      if (!match) continue
      const translated = lookup[language].get(normalise(template.key))!
      return translated.replace(/\{(\d+)\}/g, (_, slot: string) => match[template.slots.indexOf(slot) + 1] ?? '')
    }
    // Names, phone numbers, medicine names, and verbatim clinical instructions
    // are not UI copy and must remain exactly as entered.
    return value
  }

  function tx(value: string, values: Record<string, string | number>): string
  function tx<T>(value: T): T
  function tx<T>(value: T, values?: Record<string, string | number>): T | string {
    if (typeof value === 'string') {
      const translated = text(value)
      return values ? translated.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`)) : translated as T
    }
    if (Array.isArray(value)) return value.map(item => tx(item)) as T
    return value
  }

  return {
    language,
    tx,
    dateFormat: (date: Date, pattern: string) => format(date, pattern, { locale: locales[language] }),
  }
}
