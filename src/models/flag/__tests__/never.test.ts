import { CHAT_SUGGESTIONS } from '@/models/chat/chat.suggestions';
import { buildPlan } from '@/models/prep/prep.schedule';

import { breachedNeverRule, FLAG_MEANING } from '../flag.rules';

describe('breachedNeverRule', () => {
  test.each([
    'Take another dose of the preparation.',
    'Please drink more bowel prep.',
    'Have an extra dose of laxative.',
  ])('detects an extra-dose instruction: %s', (text) => {
    expect(breachedNeverRule(text)).toBe('no-extra-dose');
  });

  test.each([
    'The photograph means your scope can proceed.',
    'This picture confirms the procedure should be cancelled.',
    'The image decides whether the scope can go ahead.',
  ])('detects a photograph-based decision: %s', (text) => {
    expect(breachedNeverRule(text)).toBe('no-photo-verdict');
  });

  test.each([
    'Do not take any extra preparation.',
    'Never take another dose without speaking to the department.',
    'A photograph cannot decide whether your scope proceeds.',
    'The clinical team decides whether the procedure goes ahead.',
  ])('allows safety warnings: %s', (text) => {
    expect(breachedNeverRule(text)).toBeNull();
  });

  test('flag messages do not breach either rule', () => {
    const messages = Object.values(FLAG_MEANING).flatMap(({ patient, nurse }) => [patient, nurse]);
    for (const message of messages) expect(breachedNeverRule(message)).toBeNull();
  });

  test('real chat suggestions do not breach either rule', () => {
    for (const suggestion of CHAT_SUGGESTIONS) {
      expect(breachedNeverRule(suggestion)).toBeNull();
    }
  });

  test('real preparation actions do not breach either rule', () => {
    const plan = buildPlan('2026-09-20', new Date(2026, 8, 18, 12));
    const actionText = plan.flatMap((day) =>
      day.steps.flatMap((step) => [step.title, step.detail].filter(
        (text): text is string => text !== undefined,
      )),
    );

    expect(actionText.length).toBeGreaterThan(0);
    for (const text of actionText) expect(breachedNeverRule(text)).toBeNull();
  });
});
