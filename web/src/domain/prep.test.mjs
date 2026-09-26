import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPlan, currentDay, dateFromToday, headingFor, offsetFor, todayIn, upcomingPlan } from './prep.ts'

// Run under TZ=UTC (see `test:prep`): the zone most hosts use, and the one
// where reading "today" off the server clock put the plan a day behind.

// Procedure on Monday 12 October 2026.
const procedure = '2026-10-12'

test('procedure morning in Singapore is procedure day, whatever the server clock says', () => {
  // 07:00 on the 12th in Singapore is still 23:00 on the 11th in UTC.
  const sevenAm = new Date('2026-10-11T23:00:00Z')
  assert.equal(todayIn(sevenAm), '2026-10-12')
  assert.equal(offsetFor(procedure, sevenAm), 0)
  assert.equal(headingFor(offsetFor(procedure, sevenAm)), 'Today is the day')
})

test('the Singapore day turns over at Singapore midnight, not UTC midnight', () => {
  const beforeMidnight = new Date('2026-10-10T15:59:00Z') // 23:59 on the 10th in Singapore
  const afterMidnight = new Date('2026-10-10T16:00:00Z') // 00:00 on the 11th in Singapore
  assert.equal(offsetFor(procedure, beforeMidnight), -2)
  assert.equal(offsetFor(procedure, afterMidnight), -1)
})

test('the second dose at 2am falls on procedure day in Singapore', () => {
  const twoAm = new Date('2026-10-11T18:00:00Z') // 02:00 on the 12th in Singapore
  assert.equal(offsetFor(procedure, twoAm), 0)
})

test('dateFromToday counts from the Singapore date', () => {
  const lateEvening = new Date('2026-10-10T17:30:00Z') // 01:30 on the 11th in Singapore
  assert.equal(dateFromToday(0, lateEvening), '2026-10-11')
  assert.equal(dateFromToday(1, lateEvening), '2026-10-12')
  assert.equal(dateFromToday(-1, lateEvening), '2026-10-10')
})

test('the plan marks the Singapore day as today', () => {
  const eveningBefore = new Date('2026-10-11T10:00:00Z') // 18:00 on the 11th in Singapore
  const plan = buildPlan(procedure, eveningBefore)
  const today = currentDay(plan, offsetFor(procedure, eveningBefore))
  assert.equal(today?.date, '2026-10-11')
  assert.equal(today?.phase, 'purge_night')
})

test('the upcoming plan drops the days already done', () => {
  const dietDay = new Date('2026-10-09T02:00:00Z') // 10:00 on the 9th in Singapore, D-3
  const days = upcomingPlan(buildPlan(procedure, dietDay), dietDay)
  assert.deepEqual(days.map((d) => d.offset), [-3, -2, -1, 0])
})

test('the 2am second dose stays visible after midnight, then goes', () => {
  const oneAm = new Date('2026-10-11T17:00:00Z') // 01:00 on the 12th in Singapore
  const atOne = upcomingPlan(buildPlan(procedure, oneAm), oneAm)
  assert.deepEqual(atOne.map((d) => d.offset), [-1, 0])
  assert.deepEqual(atOne[0].steps.map((s) => s.id), ['dose-2'])

  const sevenAm = new Date('2026-10-11T23:00:00Z') // 07:00 on the 12th in Singapore
  assert.deepEqual(upcomingPlan(buildPlan(procedure, sevenAm), sevenAm).map((d) => d.offset), [0])
})
