import assert from 'node:assert/strict'
import test from 'node:test'
import { parseStoolCheck, stoolPointFor, guidanceFor, COLOURS, REASONS } from './stool-check.ts'

const clear = { reason: 'appearance', colour: 'yellow', consistency: 'watery', clarity: 'clear' }

test('rejects incomplete and malformed answers instead of inventing a clear result', () => {
  for (const value of [null, {}, { ...clear, colour: 'purple' }, { ...clear, reason: 'toString' }, { ...clear, clarity: null }, { ...clear, consistency: 'solid' }]) {
    assert.equal(parseStoolCheck(value), null)
  }
  assert.deepEqual(parseStoolCheck({ ...clear, extra: 'ignored' }), clear)
})

test('colour and frequency cannot make solid, cloudy or uncertain output clear', () => {
  for (const reason of Object.keys(REASONS)) {
    for (const colour of Object.keys(COLOURS)) {
      assert.notEqual(stoolPointFor({ ...clear, reason, colour, consistency: 'pieces', clarity: null }), 5)
      assert.notEqual(stoolPointFor({ ...clear, reason, colour, clarity: 'cloudy' }), 5)
      assert.equal(stoolPointFor({ ...clear, reason, colour, clarity: 'unsure' }), null)
    }
  }
})

test('watery plus see-through is required for the clear appearance point', () => {
  assert.equal(stoolPointFor(clear), 5)
  assert.equal(stoolPointFor({ ...clear, colour: 'green' }), 5)
  assert.equal(stoolPointFor({ ...clear, consistency: 'solid', clarity: null }), 1)
  assert.equal(stoolPointFor({ ...clear, consistency: 'pieces', clarity: null }), 3)
  assert.equal(stoolPointFor({ ...clear, clarity: 'cloudy' }), null)
})

test('dark or blood-like output routes to a person even when described as clear', () => {
  for (const colour of ['dark', 'red']) {
    const check = { ...clear, colour }
    assert.equal(stoolPointFor(check), null)
    assert.equal(guidanceFor(check).contact, true)
    assert.match(guidanceFor(check).detail, /Do not assume/)
  }
})

test('guidance distinguishes pieces, cloudiness and uncertainty without declaring readiness', () => {
  assert.match(guidanceFor({ ...clear, consistency: 'pieces', clarity: null }).title, /solid/)
  assert.match(guidanceFor({ ...clear, clarity: 'cloudy' }).title, /cloudy/)
  assert.match(guidanceFor({ ...clear, clarity: 'unsure' }).title, /unsure/)
  assert.match(guidanceFor(clear).detail, /not confirmation that you are ready/)
})
