import assert from 'node:assert/strict'
import test from 'node:test'

import { parseAssessment, verificationOf } from './verification.ts'

const good = { usable: true, point: 4, confidence: 0.9, note: 'Mostly clear liquid.' }

test('reads a well-formed assessment', () => {
  const a = parseAssessment(good)
  assert.deepEqual(a, { usable: true, point: 4, confidence: 0.9, note: 'Mostly clear liquid.' })
})

test('anything malformed reads as unusable rather than throwing', () => {
  // A patient photographing a toilet at 1am must never meet an error page.
  for (const raw of [null, undefined, 'nope', 42, [], {}, { usable: true }]) {
    const a = parseAssessment(raw)
    assert.equal(a.usable, false, `expected ${JSON.stringify(raw)} to be unusable`)
    assert.equal(a.confidence, 0)
  }
})

test('a point outside the scale is refused, not clamped', () => {
  // Clamping 7 to 5 would invent a clear result from a broken one.
  for (const point of [0, 6, 3.5, '4', null]) {
    assert.equal(parseAssessment({ ...good, point }).point, null)
  }
})

test('claiming usable without a point is not a reading', () => {
  assert.equal(parseAssessment({ usable: true, point: null, confidence: 0.99 }).usable, false)
})

test('confidence is clamped into 0..1 and zeroed when unusable', () => {
  assert.equal(parseAssessment({ ...good, confidence: 4 }).confidence, 1)
  assert.equal(parseAssessment({ ...good, confidence: -2 }).confidence, 0)
  assert.equal(parseAssessment({ ...good, confidence: Number.NaN }).confidence, 0)
  assert.equal(parseAssessment({ ...good, usable: false, confidence: 0.9 }).confidence, 0)
})

test('a clear, confident reading is not flagged', () => {
  const v = verificationOf(parseAssessment({ ...good, point: 5, confidence: 0.95 }), 5)
  assert.equal(v.flagged, false)
  assert.deepEqual(v.reasons, [])
})

test('a low reading is flagged, matching the existing red threshold', () => {
  // bowelOutput is (point - 1) / 4 and RED_BELOW is 0.5, so a 2 is already red
  // by the ward's own rules. The flag says the same thing in words.
  const v = verificationOf(parseAssessment({ ...good, point: 2, confidence: 0.95 }), 2)
  assert.equal(v.flagged, true)
  assert.ok(v.reasons.includes('low-reading'))
})

test('an uncertain reading is flagged even when it looks fine', () => {
  const v = verificationOf(parseAssessment({ ...good, point: 5, confidence: 0.2 }), 5)
  assert.equal(v.flagged, true)
  assert.ok(v.reasons.includes('low-confidence'))
})

test('an unreadable photograph is flagged and reports nothing else', () => {
  const v = verificationOf(parseAssessment({ usable: false }), null)
  assert.equal(v.flagged, true)
  assert.deepEqual(v.reasons, ['unusable'])
})

test('the patient disagreeing with the photograph is flagged', () => {
  // The model reads 2, the patient records 5. Either could be right, which is
  // exactly why a person should look.
  const v = verificationOf(parseAssessment({ ...good, point: 2, confidence: 0.9 }), 5)
  assert.equal(v.flagged, true)
  assert.ok(v.reasons.includes('disagreement'))
})

test('a small disagreement is not flagged', () => {
  const v = verificationOf(parseAssessment({ ...good, point: 4, confidence: 0.9 }), 5)
  assert.equal(v.flagged, false)
})

test('what the patient accepted is what decides a low reading', () => {
  // The model said 5, the patient overrode it to 1. The recorded value is what
  // matters clinically, so it is what the flag is based on.
  const v = verificationOf(parseAssessment({ ...good, point: 5, confidence: 0.9 }), 1)
  assert.equal(v.flagged, true)
  assert.ok(v.reasons.includes('low-reading'))
  assert.ok(v.reasons.includes('disagreement'))
})

test('with nothing accepted yet, the model reading stands in', () => {
  const v = verificationOf(parseAssessment({ ...good, point: 1, confidence: 0.9 }), null)
  assert.ok(v.reasons.includes('low-reading'))
})
