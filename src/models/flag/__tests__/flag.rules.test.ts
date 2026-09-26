import { computeFlag, scoreOf, UNMEASURED } from '../flag.rules';

const FIXED_DATE = new Date('2026-09-21T00:00:00.000Z');

describe('scoreOf', () => {
  test('applies the configured weights', () => {
    expect(scoreOf({ prepTiming: 0, bowelOutput: 1, dietCompliance: 1, fluidIntake: 1 })).toBeCloseTo(0.65);
  });

  test('renormalises weights when a signal is unmeasured', () => {
    expect(scoreOf({ prepTiming: UNMEASURED, bowelOutput: 0.8, dietCompliance: 0.8, fluidIntake: 0.8 })).toBeCloseTo(0.8);
  });

  test('distinguishes measured zero from unmeasured', () => {
    expect(scoreOf({ prepTiming: 0, bowelOutput: UNMEASURED, dietCompliance: UNMEASURED, fluidIntake: UNMEASURED })).toBe(0);
  });

  test('returns null when every signal is unmeasured', () => {
    expect(scoreOf({ prepTiming: UNMEASURED, bowelOutput: UNMEASURED, dietCompliance: UNMEASURED, fluidIntake: UNMEASURED })).toBeNull();
  });
});

describe('computeFlag', () => {
  test.each([
    [0.49, 'red'],
    [0.5, 'amber'],
    [0.749, 'amber'],
    [0.75, 'green'],
  ] as const)('classifies a uniform score of %s as %s', (value, expectedColour) => {
    const result = computeFlag(
      { prepTiming: value, bowelOutput: value, dietCompliance: value, fluidIntake: value },
      FIXED_DATE,
    );
    expect(result.colour).toBe(expectedColour);
  });

  test('a low critical signal forces red despite a high average', () => {
    const result = computeFlag(
      { prepTiming: 0.49, bowelOutput: 1, dietCompliance: 1, fluidIntake: 1 },
      FIXED_DATE,
    );
    expect(scoreOf(result.signals)).toBeGreaterThan(0.75);
    expect(result.colour).toBe('red');
    expect(result.reasons).toContain('Prep timing low');
  });

  test('reports unmeasured signals without treating them as zero', () => {
    const result = computeFlag(
      { prepTiming: UNMEASURED, bowelOutput: 0.9, dietCompliance: 0.9, fluidIntake: 0.9 },
      FIXED_DATE,
    );
    expect(result.colour).toBe('green');
    expect(result.reasons).toContain('Prep timing not recorded');
  });

  test('returns amber when nothing is measured', () => {
    const result = computeFlag(
      { prepTiming: UNMEASURED, bowelOutput: UNMEASURED, dietCompliance: UNMEASURED, fluidIntake: UNMEASURED },
      FIXED_DATE,
    );
    expect(result.colour).toBe('amber');
    expect(result.reasons).toContain('No prep data recorded');
  });

  test('uses the supplied computation time', () => {
    const result = computeFlag(
      { prepTiming: 1, bowelOutput: 1, dietCompliance: 1, fluidIntake: 1 },
      FIXED_DATE,
    );
    expect(result.computedAt).toBe(FIXED_DATE.toISOString());
  });
});
