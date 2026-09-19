import assert from 'node:assert/strict'
import test from 'node:test'

import { fluidOn, latestFluid, signalsFromInput } from './progress.ts'

test("today's glasses start again at zero on a new day", () => {
  const days = { '2026-10-10': 8 }
  assert.equal(fluidOn(days, '2026-10-10'), 8)
  assert.equal(fluidOn(days, '2026-10-11'), 0)
})

test('the flag reads the most recent day anything was recorded', () => {
  // Procedure morning: nothing yet today, so the purge night counts.
  assert.equal(latestFluid({ '2026-10-10': 8, '2026-10-11': 5 }), 5)
  assert.equal(latestFluid({ '2026-10-11': 5, '2026-10-10': 8 }), 5)
  assert.equal(latestFluid({ '2026-10-10': 8, '2026-10-11': 0 }), 8)
})

test('no fluid recorded stays unmeasured rather than becoming zero', () => {
  assert.equal(latestFluid({}), undefined)
  assert.equal(signalsFromInput({ fluidGlasses: latestFluid({}) }).fluidIntake, undefined)
  assert.equal(signalsFromInput({ fluidGlasses: latestFluid({ '2026-10-11': 6 }) }).fluidIntake, 0.75)
})
