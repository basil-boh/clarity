import assert from 'node:assert/strict'
import test from 'node:test'

import { buildPlan } from './prep.ts'
import { calendarEventsForPlan, exportPlanCalendar } from './calendar-export.ts'

const procedure = {
  date: '2026-10-12',
  hospital: 'SGH Endoscopy Clinic',
  location: 'Block 3, Level 4',
  arriveAt: '08:30',
  departmentPhone: '6321 4377',
}

test('exports the complete plan with calendar alarms and arrival details', () => {
  const plan = buildPlan(procedure.date, new Date('2026-10-01T00:00:00Z'))
  const calendar = exportPlanCalendar({
    procedure,
    plan,
    generatedAt: new Date('2026-01-01T00:00:00Z'),
  })

  assert.equal(calendar.filename, 'clarity-prep-2026-10-12.ics')
  assert.equal(calendar.events.length, plan.flatMap((day) => day.steps).length + 1)
  assert.match(calendar.content, /DTSTART;TZID=Asia\/Singapore:20261011T180000/)
  assert.match(calendar.content, /DTEND;TZID=Asia\/Singapore:20261011T183000/)
  assert.match(calendar.content, /TRIGGER:-PT15M/)
  assert.match(calendar.content, /DTSTART;VALUE=DATE:20261009/)
  assert.match(calendar.content, /TRIGGER:PT9H/)
  assert.match(calendar.content, /SUMMARY:Clarity: Arrive at SGH Endoscopy Clinic/)
  assert.match(calendar.content, /LOCATION:Block 3\\, Level 4/)
  assert.match(calendar.content, /DTSTAMP:20260101T000000Z/)
  assert.ok(calendar.content.endsWith('\r\n'))
})

test('uses occurrence-specific event IDs and skips an unavailable arrival time', () => {
  const plan = buildPlan(procedure.date)
  const events = calendarEventsForPlan({
    procedure: { ...procedure, arriveAt: '' },
    plan,
  })
  const dietEvents = events.filter((event) => event.title === 'Clarity: Low-residue meals only')

  assert.equal(events.some((event) => event.title.startsWith('Clarity: Arrive at')), false)
  assert.equal(new Set(dietEvents.map((event) => event.uid)).size, dietEvents.length)
})

test('puts the 2am second dose on the morning of the procedure, not the night before', () => {
  // The regression this guards: every step used to be stamped with the date of
  // the day it is *listed* under. The second dose is listed under the purge
  // night because that is the evening the patient is living through, but its
  // 02:00 has already crossed midnight -- so it was exported 24 hours early.
  // The alarm rang the night before the prep began and never rang for the dose
  // itself, which is the one the department says is most often skipped.
  const plan = buildPlan(procedure.date, new Date('2026-10-01T00:00:00Z'))

  const purgeNight = plan.find((day) => day.phase === 'purge_night')
  const dose2 = purgeNight.steps.find((step) => step.id === 'dose-2')
  const dose1 = purgeNight.steps.find((step) => step.id === 'dose-1')

  // Listed under the purge night ...
  assert.equal(purgeNight.date, '2026-10-11')
  // ... but happening on the 12th, the morning of the procedure.
  assert.equal(dose2.date, '2026-10-12')
  assert.equal(dose2.at, '02:00')
  // ... and strictly after the first dose, which sorting by clock face got wrong.
  assert.ok(`${dose1.date} ${dose1.at}` < `${dose2.date} ${dose2.at}`)

  const calendar = exportPlanCalendar({
    procedure,
    plan,
    generatedAt: new Date('2026-01-01T00:00:00Z'),
  })
  assert.match(calendar.content, /DTSTART;TZID=Asia\/Singapore:20261012T020000/)
  assert.doesNotMatch(calendar.content, /DTSTART;TZID=Asia\/Singapore:20261011T020000/)

  // The purgative gets a longer run-up than the default: the dose has to be
  // drunk, not merely noticed, and this one has to wake someone up.
  const secondDose = calendar.events.find((event) => event.title === 'Clarity: Second dose')
  assert.equal(secondDose.alarmLeadMinutes, 30)
})

test('escapes text and folds long iCalendar lines', () => {
  const calendar = exportPlanCalendar({
    procedure: { ...procedure, hospital: 'SGH; Unit, One' },
    plan: [
      {
        offset: -1,
        date: '2026-10-11',
        phase: 'purge_night',
        heading: 'Tonight is the prep',
        steps: [
          {
            id: 'long',
            uid: '-1:long',
            date: '2026-10-11',
            kind: 'admin',
            title: 'Bring notes, labels; and instructions',
            detail: 'A long instruction that continues far beyond a single calendar content line so the export remains valid.',
            at: null,
            weight: 'advised',
          },
        ],
      },
    ],
    generatedAt: new Date('2026-01-01T00:00:00Z'),
  })

  assert.match(calendar.content, /SUMMARY:Clarity: Bring notes\\, labels\\; and instructions/)
  assert.match(calendar.content, /\r\n /)
})
