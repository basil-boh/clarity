import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPlan } from './prep.ts'
import { LEAD_MINUTES, dueReminders, remindableSteps, stepInstant } from './reminders.ts'

// Procedure on 12 October 2026. Purge night is the evening of the 11th:
// first dose 11 Oct 18:00 SGT, second dose 12 Oct 02:00 SGT.
const PROCEDURE = '2026-10-12'
const plan = buildPlan(PROCEDURE, new Date('2026-10-01T00:00:00Z'))

/** A Singapore wall clock as a real instant. SGT is UTC+8, no daylight saving. */
const sgt = (iso) => new Date(`${iso}+08:00`)

test('reminds about both doses and nothing else', () => {
  const steps = remindableSteps(plan)
  assert.deepEqual(steps.map((s) => s.id), ['dose-1', 'dose-2'])
})

test('the second dose is at 2am on the morning of the procedure', () => {
  // The bug this guards against is the one the calendar export had: the 02:00
  // dose listed under the purge night but belonging to the next date.
  const [, dose2] = remindableSteps(plan)
  assert.equal(dose2.date, '2026-10-12')
  assert.equal(stepInstant(dose2).toISOString(), '2026-10-11T18:00:00.000Z') // 02:00 SGT
})

test('sends half an hour before a dose, not at it', () => {
  const due = dueReminders(plan, sgt('2026-10-11T17:30:00'))
  assert.equal(due.length, 1)
  assert.equal(due[0].step.id, 'dose-1')
  assert.equal(LEAD_MINUTES, 30)
})

test('stays quiet until the lead time is reached', () => {
  assert.equal(dueReminders(plan, sgt('2026-10-11T17:29:00')).length, 0)
})

test('still sends when the scheduler runs late', () => {
  // A cron that misses a run must not cost a patient their 2am reminder, so
  // the reminder stays due right up to the dose itself.
  const late = dueReminders(plan, sgt('2026-10-12T01:55:00'))
  assert.equal(late.length, 1)
  assert.equal(late[0].step.id, 'dose-2')
})

test('never sends after the dose time has passed', () => {
  // A message at 03:00 about the 02:00 dose can only tell a patient they have
  // failed, at an hour when they can do nothing about it.
  assert.equal(dueReminders(plan, sgt('2026-10-12T02:00:00')).length, 0)
  assert.equal(dueReminders(plan, sgt('2026-10-12T03:00:00')).length, 0)
})

test('does not send the same reminder twice', () => {
  const now = sgt('2026-10-12T01:40:00')
  const [first] = dueReminders(plan, now)
  assert.equal(first.step.id, 'dose-2')
  assert.equal(first.key, '2026-10-12:dose-2')

  // What the send log gives back on the next run of a fifteen-minute cron.
  assert.equal(dueReminders(plan, now, new Set([first.key])).length, 0)
})

test('the two doses have different keys, so one does not suppress the other', () => {
  const [dose1, dose2] = remindableSteps(plan)
  const key = (s) => `${s.date}:${s.id}`
  assert.notEqual(key(dose1), key(dose2))
})

test('is quiet on every other day of the run-up', () => {
  for (const at of [
    '2026-10-08T18:00:00', // diet day
    '2026-10-11T12:00:00', // purge day, hours before the first dose
    '2026-10-12T08:00:00', // procedure morning, after both doses
    '2026-10-13T18:00:00', // afterwards
  ]) {
    assert.equal(dueReminders(plan, sgt(at)).length, 0, `expected silence at ${at}`)
  }
})

test('a server running on UTC reminds at the same Singapore moment', () => {
  // The whole point of pinning the offset: Vercel runs on UTC, and reading the
  // dose time off the server's own clock would fire these eight hours out.
  const due = dueReminders(plan, new Date('2026-10-11T17:35:00Z')) // 01:35 SGT on the 12th
  assert.equal(due.length, 1)
  assert.equal(due[0].step.id, 'dose-2')
})
