import assert from 'node:assert/strict'
import test from 'node:test'
import { MAX_SAVED_MEDICATIONS, medicationIssues, medicationOccurrences, parseMedicationExtraction, parseSavedMedications, resolveMedicationDate } from './medications.ts'

const date = '2026-10-12'
const draft = {
  name: 'Example medicine', strength: '10 mg', amount: '10 mg', quantity: '1 tablet',
  action: 'take', start: 'D-2', startTime: null, end: 'D0', times: [], frequency: 1, timing: 'Each morning',
  sourceText: 'Example medicine: take 1 tablet each morning from D-2 through D0.',
  sources: [1], procedureSpecific: true, issues: [],
}
const reviewed = (patch = {}, draftPatch = {}) => ({ id: 'example', draft: { ...draft, ...draftPatch },
  reminderTimes: ['09:00'], doseAmounts: ['1 tablet'], confirmed: true, procedureDate: date, ...patch })

test('resolves relative dates across month/year boundaries and rejects invalid dates', () => {
  assert.equal(resolveMedicationDate('D-7', '2027-01-03'), '2026-12-27')
  assert.equal(resolveMedicationDate('D0', date), date)
  assert.equal(resolveMedicationDate('2026-02-30', date), null)
  assert.equal(resolveMedicationDate('tomorrow', date), null)
})

test('only complete confirmed instructions can generate reminders', () => {
  for (const entry of [reviewed({ confirmed: false }), reviewed({ doseAmounts: [''] }),
    reviewed({}, { start: null }), reviewed({}, { procedureSpecific: false }),
    reviewed({}, { issues: ['Conflicting instructions on photos 1 and 2'] }),
    reviewed({}, { issues: ['Conditional: take only if instructed'] }),
    reviewed({}, { frequency: null }), reviewed({ reminderTimes: ['25:00'] })]) {
    assert.deepEqual(medicationOccurrences([entry], date), [])
  }
  assert.equal(medicationOccurrences([reviewed()], date).length, 3)
  assert.deepEqual(medicationOccurrences([reviewed()], '2026-10-13'), [])
  assert.deepEqual(medicationOccurrences([], date), [])
})

test('hold instructions do not need a dose and do not imply a restart', () => {
  const events = medicationOccurrences([reviewed({}, { action: 'hold', startTime: '08:00', amount: null, quantity: null, frequency: null })], date)
  assert.equal(events.length, 3)
  assert.equal(events[0].title, 'Do not take Example medicine')
  assert.ok(events.every(e => e.date <= date))
})

test('hold start and reminder are separate; first alert never precedes the hold', () => {
  const entry = reviewed({ reminderTimes: ['09:00'], doseAmounts: [] }, {
    action: 'hold', startTime: '18:00', end: null, amount: null, quantity: null, frequency: null, times: [],
  })
  assert.deepEqual(medicationIssues(entry, date), [])
  const events = medicationOccurrences([entry], date)
  assert.equal(events.length, 3)
  assert.equal(events[0].time, '18:00')
  assert.equal(events[1].time, '09:00')
  assert.match(events[0].description, /Do not take from 2026-10-10 at 18:00/)
  assert.match(events[0].description, /No restart date is implied/)
  assert.deepEqual(medicationOccurrences([{ ...entry, draft: { ...entry.draft, startTime: null } }], date), [])
  assert.equal(medicationOccurrences([{ ...entry, reminderTimes: ['20:00'] }], date)[0].time, '20:00')
})

test('an omitted last day limits reminders to procedure day; explicit earlier ends are respected', () => {
  assert.equal(medicationOccurrences([reviewed({}, { end: null })], date).length, 3)
  assert.equal(medicationOccurrences([reviewed({}, { end: 'D-1' })], date).length, 2)
  assert.deepEqual(medicationOccurrences([reviewed({}, { end: 'not a date' })], date), [])
  assert.deepEqual(medicationOccurrences([reviewed({}, { end: 'D-3' })], date), [])
})

test('multiple daily doses carry their own amounts and reject duplicate times', () => {
  const entry = reviewed({ reminderTimes: ['08:00', '19:00'], doseAmounts: ['1 tablet', '2 tablets'] }, { times: ['08:00'], frequency: 2 })
  const events = medicationOccurrences([entry], date)
  assert.equal(events.length, 6)
  assert.match(events[0].description, /Time to take: 08:00/)
  assert.match(events[0].description, /Dose: 1 tablet/)
  assert.match(events[1].description, /Dose: 2 tablets/)
  assert.match(events[1].description, /Time to take: 19:00/)
  assert.ok(medicationIssues({ ...entry, reminderTimes: ['08:00', '08:00'] }, date).length)
  assert.deepEqual(events, medicationOccurrences([entry], date))
  assert.equal(new Set(events.map(e => e.uid)).size, events.length)
})

test('supports instructions earlier than seven days and clips at procedure day', () => {
  const events = medicationOccurrences([reviewed({}, { start: 'D-10', end: 'D+2' })], date)
  assert.equal(events.length, 11)
  assert.equal(events[0].date, '2026-10-02')
  assert.equal(events.at(-1).date, date)
  assert.deepEqual(medicationOccurrences([reviewed({}, { start: 'D+1', end: 'D+2' })], date), [])
})

test('validates extraction types, source references, and clock times', () => {
  assert.deepEqual(parseMedicationExtraction({ medications: [draft] }, 1), [draft])
  for (const patch of [{ sources: [2] }, { times: ['morning'] }, { frequency: 100 }, { action: 'restart' }, { issues: 'none' }]) {
    assert.throws(() => parseMedicationExtraction({ medications: [{ ...draft, ...patch }] }, 1))
  }
  assert.throws(() => parseMedicationExtraction({ medications: [{}] }, 1))
})

test('normalizes explicit clocks and absent start times without assigning missing clinical values', () => {
  for (const startTime of [undefined, '', 'null', 'N/A', null]) {
    const [result] = parseMedicationExtraction({ medications: [{ ...draft, startTime, start: 'null', times: ['8:00 AM', '8:00 PM'] }] }, 1)
    assert.equal(result.startTime, null)
    assert.equal(result.start, null)
    assert.deepEqual(result.times, ['08:00', '20:00'])
    assert.deepEqual(medicationOccurrences([reviewed({ draft: result })], date), [])
  }
  const [result] = parseMedicationExtraction({ medications: [{ ...draft, startTime: '12:00 AM', times: ['12:00 PM', '8:00'] }] }, 1)
  assert.equal(result.startTime, '00:00')
  assert.deepEqual(result.times, ['12:00', '08:00'])
  assert.throws(() => parseMedicationExtraction({ medications: [{ ...draft, startTime: 'morning' }] }, 1))
  assert.throws(() => parseMedicationExtraction({ medications: [{ ...draft, startTime: '13:00 PM' }] }, 1))
})

test('saved entries: confirmed ones in the review shape are kept, anything else is dropped', () => {
  assert.deepEqual(parseSavedMedications([reviewed()]), [reviewed()])
  // A stored entry still produces the same reminders after a reload.
  assert.equal(medicationOccurrences(parseSavedMedications(JSON.parse(JSON.stringify([reviewed()]))), date).length, 3)
  for (const bad of [null, 'x', { ...reviewed(), confirmed: false }, { ...reviewed(), id: '<script>' },
    { ...reviewed(), procedureDate: '12/10/2026' }, { ...reviewed(), reminderTimes: 'nine' },
    { ...reviewed(), doseAmounts: ['x'.repeat(201)] }, { ...reviewed(), draft: null },
    reviewed({}, { sources: [9] }), reviewed({}, { action: 'double' })]) {
    assert.deepEqual(parseSavedMedications([bad]), [])
  }
  assert.deepEqual(parseSavedMedications('not a list'), [])
  assert.equal(parseSavedMedications(Array.from({ length: 40 }, (_, i) => reviewed({ id: `e${i}` }))).length, MAX_SAVED_MEDICATIONS)
})

test('saved entries survive a reschedule so they can be reviewed again, not silently used', () => {
  const [kept] = parseSavedMedications([reviewed()])
  assert.ok(kept)
  assert.ok(medicationIssues(kept, '2026-10-20').includes('The procedure date changed. Read and review the instructions again.'))
  assert.deepEqual(medicationOccurrences([kept], '2026-10-20'), [])
})
