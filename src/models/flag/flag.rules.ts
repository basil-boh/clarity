import type { FlagColour } from '@/theme';

import type { FlagSignals, PrepFlag } from '@/models/prep/prep.types';

/**
 * The two things this app will never do.
 *
 * Both came out of the CW12 interviews and both are constraints on the
 * *software*, not advice to the patient, which is why they live in code as a
 * checked list rather than in a design document.
 *
 * They are exported so the screens that could plausibly violate them (the
 * chatbot, the stool check, the flag) can render them verbatim, and so a test
 * can assert that no suggested action ever matches one.
 */
export const NEVER = [
  {
    id: 'no-extra-dose',
    rule: 'Never tell a patient to take more purgative.',
    because:
      'Staff warned that extra doses are unsafe for elderly patients and for anyone with kidney or heart disease. That decision stays with the clinical team.',
  },
  {
    id: 'no-photo-verdict',
    rule: 'Never let a photograph alone decide whether a scope goes ahead.',
    because:
      'A photograph informs the patient and raises a flag. The clinical team decides.',
  },
] as const;

type NeverRuleId = (typeof NEVER)[number]['id'];

/** Detects affirmative suggestions that breach either product safety rule. */
const FORBIDDEN_SUGGESTIONS: ReadonlyArray<{ id: NeverRuleId; pattern: RegExp }> = [
  {
    id: 'no-extra-dose',
    pattern:
      /(?:^|[.!?]\s*)(?:please\s+)?(?:take|drink|have)\b[^.?!]{0,60}\b(?:another|extra|more|repeat)\b[^.?!]{0,40}\b(?:dose|prep|preparation|laxative)\b/i,
  },
  {
    id: 'no-photo-verdict',
    pattern:
      /\b(?:photo|photograph|picture|image)\b[^.?!]{0,80}\b(?:means?|shows?|confirms?|decides?)\b[^.?!]{0,40}\b(?:cancel(?:led|s|ling)?|postpone[ds]?|proceed|go ahead)\b/i,
  },
];

export function breachedNeverRule(text: string): NeverRuleId | null {
  return FORBIDDEN_SUGGESTIONS.find(({ pattern }) => pattern.test(text))?.id ?? null;
}

/**
 * How much each signal counts.
 *
 * Not equal, and the split is the whole argument of the pitch: timing and
 * output are measurements of whether the bowel is actually clearing, and diet
 * is a measurement of how well the patient was carried through the week. Both
 * matter, but only the first two change what the endoscopist will see.
 *
 * Fluid intake is weighted lowest and is still here for a reason that is not
 * about cleanliness: under-drinking during a purge is the most common route to
 * a cancelled list through dehydration rather than through a dirty colon.
 */
export const WEIGHTS: Readonly<Record<keyof FlagSignals, number>> = {
  prepTiming: 0.35,
  bowelOutput: 0.35,
  dietCompliance: 0.2,
  fluidIntake: 0.1,
};

/** Below this, the morning needs a human to look. */
const AMBER_BELOW = 0.75;
/** Below this, the patient should be talking to the department, not the app. */
const RED_BELOW = 0.5;

/**
 * A signal the app could not measure at all.
 *
 * Distinct from a signal measured as zero, and the distinction is the point: a
 * patient who never opened the app has not failed their prep, and colouring
 * them red would teach the ward to ignore the colour. Missing signals are
 * dropped from the weighted mean and named in `reasons`, so the nurse sees
 * "timing not recorded" rather than a red flag built out of silence.
 */
export const UNMEASURED = -1;

function isMeasured(value: number): boolean {
  return value >= 0;
}

export function scoreOf(signals: FlagSignals): number | null {
  const entries = (Object.keys(WEIGHTS) as (keyof FlagSignals)[]).filter((key) =>
    isMeasured(signals[key]),
);
  if (entries.length === 0) return null;

  const weight = entries.reduce((sum, key) => sum + WEIGHTS[key], 0);
  const score = entries.reduce((sum, key) => sum + signals[key] * WEIGHTS[key], 0);
  return score / weight;
}

const SIGNAL_NAMES: Readonly<Record<keyof FlagSignals, string>> = {
  dietCompliance: 'Diet compliance',
  prepTiming: 'Prep timing',
  fluidIntake: 'Fluid intake',
  bowelOutput: 'Bowel output',
};

/**
 * Four signals in, one colour out.
 *
 * A critical signal that is on its own below the red line pulls the whole flag
 * red regardless of the mean, because the mean is exactly what would hide it: a
 * patient who drank every glass of water and skipped the second dose averages
 * out comfortably amber, and that is the patient whose list slot is about to be
 * wasted.
 */
export function computeFlag(signals: FlagSignals, computedAt = new Date()): PrepFlag {
  const score = scoreOf(signals);
  const reasons: string[] = [];

  for (const key of Object.keys(WEIGHTS) as (keyof FlagSignals)[]) {
    if (!isMeasured(signals[key])) reasons.push(`${SIGNAL_NAMES[key]} not recorded`);
    else if (signals[key] < RED_BELOW) reasons.push(`${SIGNAL_NAMES[key]} low`);
    else if (signals[key] < AMBER_BELOW) reasons.push(`${SIGNAL_NAMES[key]} below target`);
  }

  const criticalFailure =
    (isMeasured(signals.prepTiming) && signals.prepTiming < RED_BELOW) ||
    (isMeasured(signals.bowelOutput) && signals.bowelOutput < RED_BELOW);

  let colour: FlagColour;
  if (score === null) {
    // Nothing measured at all is a check, not a pass and not a failure.
    colour = 'amber';
    reasons.push('No prep data recorded');
  } else if (criticalFailure || score < RED_BELOW) {
    colour = 'red';
  } else if (score < AMBER_BELOW) {
    colour = 'amber';
  } else {
    colour = 'green';
  }

  return { colour, signals, reasons, computedAt: computedAt.toISOString() };
}

/**
 * What the flag means, said to the person reading it.
 *
 * Two audiences, two sentences, and neither is the other's. The patient one
 * never implies the scope is cancelled (that is not the app's call) and the
 * nurse one never states a cause it has not measured.
 */
export const FLAG_MEANING: Readonly<
  Record<FlagColour, { patient: string; nurse: string }>
> = {
  green: {
    patient: 'Your prep is on track. Come in as planned.',
    nurse: 'Compliance data consistent with an adequate prep.',
  },
  amber: {
    patient:
      'Something in your prep is worth a check. Bring this summary with you and mention it at admission.',
    nurse: 'One or more signals below target. Worth asking before the list is set.',
  },
  red: {
    patient:
      'Please call the endoscopy department before you travel. Do not take any extra preparation.',
    nurse: 'Critical signal low or missing. Review before the patient is sent through.',
  },
};
