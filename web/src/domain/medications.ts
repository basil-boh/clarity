/** Transcription only: clinical instructions come from the uploaded department sheet. */
export type MedicationDraft = {
  name: string
  strength: string | null
  amount: string | null
  quantity: string | null
  action: 'take' | 'hold' | null
  start: string | null
  startTime: string | null
  end: string | null
  times: string[]
  frequency: number | null
  timing: string
  sourceText: string
  sources: number[]
  procedureSpecific: boolean
  issues: string[]
}

export type ReviewedMedication = {
  id: string
  draft: MedicationDraft
  reminderTimes: string[]
  doseAmounts: string[]
  confirmed: boolean
  procedureDate: string
}

export type MedicationOccurrence = {
  uid: string
  date: string
  time: string
  title: string
  description: string
}

export const MAX_IMAGES = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

const DAY = 86400000
function dateValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const ms = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : null
}

/** Relative dates stay symbolic until this deterministic step. */
export function resolveMedicationDate(value: string | null, procedureDate: string): string | null {
  if (!value) return null
  if (dateValue(value) !== null) return value
  const match = /^D(-\d{1,3}|\+\d{1,3}|0)$/.exec(value)
  const procedure = dateValue(procedureDate)
  if (!match || procedure === null) return null
  return new Date(procedure + Number(match[1]) * DAY).toISOString().slice(0, 10)
}

/** Diagnostics contain field names only, never extracted patient information. */
export class MedicationValidationError extends Error {
  readonly fields: string[]
  constructor(fields: string[]) {
    super('Invalid medication extraction')
    this.name = 'MedicationValidationError'
    this.fields = fields
  }
}

function nullableText(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return !trimmed || /^(null|n\/a|not specified)$/i.test(trimmed) ? null : trimmed
}

/** Reformat explicit clock times only; never guess a time from 'morning', etc. */
function normalizeClock(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const text = value.trim()
  const twelve = /^(\d{1,2}):(\d{2})\s*([ap])\.?m\.?$/i.exec(text)
  if (twelve) {
    const hour = Number(twelve[1])
    if (hour < 1 || hour > 12 || Number(twelve[2]) > 59) return text
    return `${String(hour % 12 + (twelve[3].toLowerCase() === 'p' ? 12 : 0)).padStart(2, '0')}:${twelve[2]}`
  }
  const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(text)
  return twentyFour ? `${twentyFour[1].padStart(2, '0')}:${twentyFour[2]}` : text
}

/** Normalize harmless transcription formatting, then validate the full document. */
export function parseMedicationExtraction(value: unknown, imageCount: number): MedicationDraft[] {
  if (!value || typeof value !== 'object' || !('medications' in value) ||
      !Array.isArray(value.medications) || value.medications.length > 30) throw new MedicationValidationError(['medications'])
  return value.medications.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new MedicationValidationError(['entry'])
    const d = { ...item } as Record<string, unknown>
    const fields: string[] = []
    const strings = ['name', 'timing', 'sourceText']
    const nullable = ['strength', 'amount', 'quantity', 'start', 'end', 'startTime']
    // Older responses did not include this newly introduced field. Missing never means midnight.
    if (d.startTime === undefined) d.startTime = null
    for (const k of nullable) d[k] = nullableText(d[k])
    d.startTime = normalizeClock(d.startTime)
    if (Array.isArray(d.times)) d.times = d.times.map(normalizeClock)
    for (const k of strings) if (typeof d[k] !== 'string' || (d[k] as string).length > 4000) fields.push(k)
    for (const k of nullable) if (d[k] !== null && (typeof d[k] !== 'string' || (d[k] as string).length > 500)) fields.push(k)
    if (![null, 'take', 'hold'].includes(d.action as string | null)) fields.push('action')
    if (typeof d.procedureSpecific !== 'boolean') fields.push('procedureSpecific')
    if (d.startTime !== null && (typeof d.startTime !== 'string' || !validTime(d.startTime))) fields.push('startTime')
    if (d.frequency !== null && (!Number.isInteger(d.frequency) || Number(d.frequency) < 1 || Number(d.frequency) > 8)) fields.push('frequency')
    if (!Array.isArray(d.times) || d.times.length > 8 || d.times.some(t => typeof t !== 'string' || !validTime(t))) fields.push('times')
    if (!Array.isArray(d.issues) || d.issues.length > 20 || d.issues.some(t => typeof t !== 'string' || t.length > 1000)) fields.push('issues')
    if (!Array.isArray(d.sources) || !d.sources.length || d.sources.some(n => !Number.isInteger(n) || n < 1 || n > imageCount)) fields.push('sources')
    if (fields.length) throw new MedicationValidationError([...new Set(fields)])
    return d as MedicationDraft
  })
}

export function medicationIssues(entry: ReviewedMedication, procedureDate: string): string[] {
  const d = entry.draft
  const issues = [...d.issues]
  if (entry.procedureDate !== procedureDate) issues.push('The procedure date changed. Read and review the instructions again.')
  if (!d.procedureSpecific) issues.push('This sheet does not provide procedure-specific instructions for this medicine.')
  if (!d.name.trim() || !d.sourceText.trim()) issues.push('A medicine name and readable source instruction are required.')
  if (!d.action) issues.push('The hospital/clinic must specify whether to take or hold this medicine.')
  const start = resolveMedicationDate(d.start, procedureDate)
  const end = d.end === null ? procedureDate : resolveMedicationDate(d.end, procedureDate)
  if (!start) issues.push('Enter the day these instructions start.')
  if (!end) issues.push('Check the earlier last day copied from the sheet.')
  if (d.action === 'hold' && (!d.startTime || !validTime(d.startTime))) issues.push('Enter the time you were instructed to stop taking this medicine.')
  if (start && end && (end < start || start > procedureDate || (Date.parse(end) - Date.parse(start)) / DAY > 366)) {
    issues.push('This schedule must start on or before the procedure, end after it starts, and span at most a year.')
  }
  if (d.action === 'take' && !d.frequency) issues.push('The number of daily doses must be stated in the instructions.')
  const expected = d.action === 'hold' ? 1 : d.frequency
  if (!expected || entry.reminderTimes.length !== expected || entry.reminderTimes.some(t => !validTime(t)) ||
      new Set(entry.reminderTimes).size !== entry.reminderTimes.length) issues.push('Choose a distinct reminder time for each daily instruction.')
  if (d.action === 'take' && (entry.doseAmounts.length !== entry.reminderTimes.length || entry.doseAmounts.some(amount => !amount.trim()))) {
    issues.push('Enter the prescribed dose for each time you take this medicine.')
  }
  return [...new Set(issues)]
}

export function medicationOccurrences(entries: readonly ReviewedMedication[], procedureDate: string): MedicationOccurrence[] {
  return entries.flatMap(entry => {
    if (!entry.confirmed || medicationIssues(entry, procedureDate).length) return []
    const d = entry.draft
    const start = resolveMedicationDate(d.start, procedureDate)!
    const end = d.end === null ? procedureDate : resolveMedicationDate(d.end, procedureDate)!
    const finalDay = end < procedureDate ? end : procedureDate
    const occurrences: MedicationOccurrence[] = []
    for (let ms = Date.parse(start); ms <= Date.parse(finalDay); ms += DAY) {
      const date = new Date(ms).toISOString().slice(0, 10)
      entry.reminderTimes.forEach((time, index) => {
        // On the first day, the hold starts at its instructed time. Never remind earlier.
        const eventTime = d.action === 'hold' && date === start && time < d.startTime! ? d.startTime! : time
        const details = [d.strength && `Medicine details: ${d.strength}`,
          d.action === 'take' && `Dose: ${entry.doseAmounts[index]}`,
          d.action === 'hold' && `Do not take from ${start} at ${d.startTime}.`,
          `Hospital/clinic instruction: ${d.sourceText}`, d.timing && `Written timing: ${d.timing}`,
          d.action === 'hold' ? `Daily reminder: ${time}. No restart date is implied.` : `Time to take: ${time}`,
          `Calendar reminders end on ${finalDay}; follow your hospital/clinic's instructions after that.`]
        occurrences.push({ uid: `med-${entry.id}-${date}-${index}`, date, time: eventTime,
          title: `${d.action === 'hold' ? 'Do not take' : 'Take'} ${d.name}${d.action === 'take' ? ` — ${entry.doseAmounts[index]}` : ''}`,
          description: details.filter(Boolean).join('\n') })
      })
    }
    return occurrences
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
}

/** At most this many confirmed entries are kept against a patient. */
export const MAX_SAVED_MEDICATIONS = 30

const stringList = (value: unknown, max: number, length: number): value is string[] =>
  Array.isArray(value) && value.length <= max && value.every(v => typeof v === 'string' && v.length <= length)

/**
 * Confirmed entries in the shape the review screen makes, from storage or from
 * the browser -- anything else is dropped rather than trusted. Shape only: an
 * entry the procedure date has since moved under is kept, so the screen can ask
 * for it to be reviewed again. Saving also drops entries with open issues.
 */
export function parseSavedMedications(value: unknown): ReviewedMedication[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, MAX_SAVED_MEDICATIONS).flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return []
    const e = item as Record<string, unknown>
    if (typeof e.id !== 'string' || !/^[A-Za-z0-9-]{1,64}$/.test(e.id) || e.confirmed !== true) return []
    if (typeof e.procedureDate !== 'string' || dateValue(e.procedureDate) === null) return []
    if (!stringList(e.reminderTimes, 8, 5) || !stringList(e.doseAmounts, 8, 200)) return []
    try {
      const [draft] = parseMedicationExtraction({ medications: [e.draft] }, MAX_IMAGES)
      return [{ id: e.id, draft, reminderTimes: e.reminderTimes, doseAmounts: e.doseAmounts, confirmed: true, procedureDate: e.procedureDate }]
    } catch {
      return []
    }
  })
}
