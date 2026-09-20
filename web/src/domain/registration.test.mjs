import assert from 'node:assert/strict'
import test from 'node:test'

import { parseRegistration } from './registration.ts'

// A fixed instant, so "today" never drifts under the suite. 15:00 UTC is
// 23:00 in Singapore -- late enough that a naive server-clock reading would
// already be on the next date, which is the bug `todayIn` exists to avoid.
const NOW = new Date('2026-09-20T15:00:00Z')
const ok = (over = {}) => ({ name: 'Tan Wei Ming', date: '2026-10-01', language: 'en', ...over })

test('accepts a name, a future date and a language', () => {
  const result = parseRegistration(ok(), NOW)
  assert.equal(result.ok, true)
  assert.deepEqual(result.value, {
    name: 'Tan Wei Ming',
    date: '2026-10-01',
    language: 'en',
  })
})

test('tidies the name rather than refusing it', () => {
  const result = parseRegistration(ok({ name: '  Siti   binte   Rahman \n' }), NOW)
  assert.equal(result.ok, true)
  assert.equal(result.value.name, 'Siti binte Rahman')
})

test('refuses a missing name', () => {
  for (const name of ['', '   ', undefined, null, 42]) {
    const result = parseRegistration(ok({ name }), NOW)
    assert.equal(result.ok, false, `expected ${JSON.stringify(name)} to be refused`)
    assert.equal(result.errors.name, 'nameMissing')
  }
})

test('refuses a date that has already passed', () => {
  const result = parseRegistration(ok({ date: '2026-09-19' }), NOW)
  assert.equal(result.ok, false)
  assert.equal(result.errors.date, 'datePast')
})

test('accepts the day of the procedure itself', () => {
  // In Singapore it is already the 20th at this instant, and someone signing in
  // on the morning of their scope must not be told their date has passed.
  const result = parseRegistration(ok({ date: '2026-09-20' }), NOW)
  assert.equal(result.ok, true)
})

test('refuses a date beyond three years, which is a typo not a booking', () => {
  const result = parseRegistration(ok({ date: '2031-01-01' }), NOW)
  assert.equal(result.ok, false)
  assert.equal(result.errors.date, 'dateTooFar')
})

test('refuses a date that does not exist instead of rolling it forward', () => {
  // parseISO turns 31 February into 3 March. Accepting that would move a
  // patient's whole preparation by two days without telling them.
  const result = parseRegistration(ok({ date: '2027-02-31' }), NOW)
  assert.equal(result.ok, false)
  assert.equal(result.errors.date, 'dateUnreadable')
})

test('refuses anything that is not yyyy-MM-dd', () => {
  for (const date of ['01/10/2026', '2026-10', 'tomorrow', '', undefined]) {
    const result = parseRegistration(ok({ date }), NOW)
    assert.equal(result.ok, false, `expected ${JSON.stringify(date)} to be refused`)
    assert.ok(result.errors.date)
  }
})

test('reports both fields at once, so the form is not fixed one error at a time', () => {
  const result = parseRegistration({ name: '', date: '', language: 'zh' }, NOW)
  assert.equal(result.ok, false)
  assert.equal(result.errors.name, 'nameMissing')
  assert.equal(result.errors.date, 'dateMissing')
})

test('keeps a known language and falls back to English for anything else', () => {
  for (const language of ['zh', 'ms', 'ta', 'en']) {
    assert.equal(parseRegistration(ok({ language }), NOW).value.language, language)
  }
  for (const language of ['fr', '', undefined, 7]) {
    assert.equal(parseRegistration(ok({ language }), NOW).value.language, 'en')
  }
})
