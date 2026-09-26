import assert from 'node:assert/strict'
import test from 'node:test'
import { readinessFlag, dietRating, prepRating, stoolRating, FLAG_COPY } from './readiness.ts'

const matrix = {
  good: ['green', 'amber', 'red'],
  partial: ['amber', 'amber', 'red'],
  poor: ['red', 'red', 'red'],
}
test('every cell of the requested matrix holds for every diet rating', () => {
  for (const [prep, expected] of Object.entries(matrix)) {
    for (const [i, stool] of ['ready', 'almost', 'not-ready'].entries()) {
      for (const diet of ['good', 'partial', 'poor', 'unknown']) assert.equal(readinessFlag(prep, stool, diet), expected[i])
    }
  }
})
test('missing observations stay amber, but never mask a known red trigger', () => {
  assert.equal(readinessFlag('unknown', 'unknown', 'poor'), 'amber')
  assert.equal(readinessFlag('good', 'unknown', 'good'), 'amber')
  assert.equal(readinessFlag('unknown', 'ready', 'good'), 'amber')
  assert.equal(readinessFlag('poor', 'unknown', 'good'), 'red')
  assert.equal(readinessFlag('unknown', 'not-ready', 'good'), 'red')
})
const doses = [{ id: 'dose-1', volumeMl: 1000 }, { id: 'dose-2', volumeMl: 1000 }]
const full = { 'dose-1': 1000, 'dose-2': 1000 }
const timed = ['-1:timing-dose-1', '-1:timing-dose-2']
test('good prep requires every dose confirmed finished on time; reports take priority', () => {
  assert.equal(prepRating(doses, full, timed), 'good')
  assert.equal(prepRating(doses, {}, timed), 'good')
  assert.equal(prepRating(doses, full, []), 'unknown')
  assert.equal(prepRating(doses, {}, []), 'unknown')
  assert.equal(prepRating(doses, {}, ['-1:timing-dose-1']), 'unknown')
  assert.equal(prepRating(doses, full, [...timed, '-1:readiness-incomplete']), 'poor')
  assert.equal(prepRating(doses, {}, ['-1:readiness-completing']), 'partial')
  assert.equal(prepRating(doses, {}, ['-1:readiness-late']), 'partial')
})
const clear = { reason: 'frequency', colour: 'yellow', consistency: 'watery', clarity: 'clear' }
test('only a procedure-morning observation contributes a stool rating', () => {
  assert.equal(stoolRating(clear, false), 'unknown')
  assert.equal(stoolRating(null, true), 'unknown')
  assert.equal(stoolRating(clear, true), 'ready')
  assert.equal(stoolRating({ ...clear, colour: 'orange', consistency: 'flecks' }, true), 'almost')
  assert.equal(stoolRating({ ...clear, colour: 'brown' }, true), 'not-ready')
  assert.equal(stoolRating({ ...clear, clarity: 'cloudy' }, true), 'not-ready')
  assert.equal(stoolRating({ ...clear, consistency: 'solid', clarity: null }, true), 'not-ready')
  assert.equal(stoolRating({ ...clear, colour: 'red' }, true), 'unknown')
  assert.equal(stoolRating({ ...clear, clarity: 'unsure' }, true), 'unknown')
})
test('diet classifies required days without turning missing records into poor', () => {
  assert.equal(dietRating({}), 'unknown')
  assert.equal(dietRating({ '-3': 'yes', '-2': 'yes', '-1': 'yes' }), 'good')
  assert.equal(dietRating({ '-3': 'yes', '-2': 'mostly', '-1': 'no' }), 'partial')
  assert.equal(dietRating({ '-3': 'no', '-2': 'no', '-1': 'mostly' }), 'poor')
})
test('flag messages do not direct attendance or cancellation', () => {
  for (const copy of Object.values(FLAG_COPY)) assert.doesNotMatch(copy.detail, /head in|travel|cancel|go ahead|attend|extra purgative/i)
})
