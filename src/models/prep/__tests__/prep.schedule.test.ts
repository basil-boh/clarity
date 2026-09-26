import { buildPlan, currentDay, headingFor, offsetFor, phaseFor, stepsFor } from '../prep.schedule';

describe('phaseFor', () => {
  test.each([
    [1, 'done'], [0, 'procedure_day'], [-1, 'purge_night'], [-2, 'diet_day'],
    [-3, 'diet_day'], [-4, 'week_before'], [-7, 'week_before'], [-8, 'waiting'],
  ] as const)('maps offset %i to %s', (offset, expectedPhase) => {
    expect(phaseFor(offset)).toBe(expectedPhase);
  });
});

describe('offsetFor', () => {
  test('calculates the offset from the procedure date', () => {
    expect(offsetFor('2026-09-20', new Date(2026, 8, 18, 12))).toBe(-2);
  });
});

describe('headingFor', () => {
  test.each([
    [1, 'Your procedure has passed'], [0, 'Today is the day'],
    [-1, 'Tonight is the prep'], [-2, 'Tomorrow you start the prep'], [-7, '7 days to go'],
  ] as const)('returns the correct heading for offset %i', (offset, expectedHeading) => {
    expect(headingFor(offset)).toBe(expectedHeading);
  });
});

describe('buildPlan', () => {
  const plan = buildPlan('2026-09-20', new Date(2026, 8, 18, 12));

  test('builds the correct date range', () => {
    expect(plan[0]).toMatchObject({ offset: -7, date: '2026-09-13', phase: 'week_before' });
    expect(plan.at(-1)).toMatchObject({ offset: 0, date: '2026-09-20', phase: 'procedure_day' });
  });

  test('includes diet steps on diet days', () => {
    const dietDay = plan.find((day) => day.offset === -2);
    expect(dietDay?.phase).toBe('diet_day');
    expect(dietDay?.steps.map((step) => step.id)).toEqual(['low-residue', 'fluids-day']);
  });

  test('includes the week-before preparation steps', () => {
    const weekBefore = plan.find((day) => day.offset === -7);
    expect(weekBefore?.phase).toBe('week_before');
    expect(weekBefore?.steps.map((step) => step.id)).toEqual([
      'confirm-meds', 'arrange-escort', 'collect-prep',
    ]);
  });

  test('includes both doses on purge night', () => {
    const purgeNight = plan.find((day) => day.offset === -1);
    expect(purgeNight?.phase).toBe('purge_night');
    expect(purgeNight?.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'dose-1', at: '18:00', weight: 'critical' }),
      expect.objectContaining({ id: 'dose-2', at: '02:00', weight: 'critical' }),
    ]));
  });

  test('includes procedure-day instructions', () => {
    expect(plan.find((day) => day.offset === 0)?.steps.map((step) => step.id)).toEqual([
      'nil-by-mouth', 'share-flag',
    ]);
  });

  test('finds the current plan day', () => {
    expect(currentDay(plan, -2)?.phase).toBe('diet_day');
  });

  test('returns undefined for a day outside the generated plan', () => {
    expect(currentDay(plan, -10)).toBeUndefined();
  });
});

describe('stepsFor', () => {
  test.each([
    [-8, 'waiting'],
    [1, 'done'],
  ] as const)('returns no actions for the %s phase', (offset, expectedPhase) => {
    expect(phaseFor(offset)).toBe(expectedPhase);
    expect(stepsFor(offset)).toEqual([]);
  });
});
