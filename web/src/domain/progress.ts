/**
 * The progress tracker.
 *
 * Ported from the Expo app's flag rules, which existed to put a single
 * green/amber/red signal in front of a nurse on the morning of the procedure.
 * The same four signals drive the patient-facing tracker here, because a
 * patient who can see which signal is dragging can still fix it -- and a
 * tracker that reports a different number from the one the ward sees would be
 * worse than no tracker.
 */

export type FlagColour = 'green' | 'amber' | 'red'

/** The four signals in. Each is 0-1, and each is a measurement, not a guess. */
export type Signals = {
  readonly dietCompliance: number
  readonly prepTiming: number
  readonly fluidIntake: number
  readonly bowelOutput: number
}

export type Flag = {
  readonly colour: FlagColour
  readonly signals: Signals
  readonly reasons: readonly string[]
  readonly computedAt: string
}

/**
 * The two things this app will never do. Both came out of the CW12 interviews
 * and both are constraints on the *software*, not advice to the patient.
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
    because: 'A photograph informs the patient and raises a flag. The clinical team decides.',
  },
] as const

/**
 * How much each signal counts.
 *
 * Not equal, and the split is the whole argument of the pitch: timing and
 * output measure whether the bowel is actually clearing, diet measures how well
 * the patient was carried through the week. Both matter, but only the first two
 * change what the endoscopist will see.
 *
 * Fluid is weighted lowest and is still here for a reason that is not about
 * cleanliness: under-drinking during a purge is the most common route to a
 * cancelled list through dehydration rather than through a dirty colon.
 */
export const WEIGHTS: Readonly<Record<keyof Signals, number>> = {
  prepTiming: 0.35,
  bowelOutput: 0.35,
  dietCompliance: 0.2,
  fluidIntake: 0.1,
}

/** Below this, the morning needs a human to look. */
export const AMBER_BELOW = 0.75
/** Below this, the patient should be talking to the department, not the app. */
export const RED_BELOW = 0.5

/**
 * One signal graded on its own, for the patient's detail screen only.
 *
 * The headline flag stays a single triage signal -- that is what the ward reads,
 * and four competing flags is exactly what the deck argued against. But the
 * detail screen exists so a patient can see *which* signal to fix, and painting
 * a 70% fluid intake in the overall green would quietly contradict the
 * "Fluids below target" line printed underneath it.
 */
export function gradeOf(value: number): FlagColour | null {
  if (value < 0) return null
  if (value < RED_BELOW) return 'red'
  if (value < AMBER_BELOW) return 'amber'
  return 'green'
}

/**
 * A signal the app could not measure at all.
 *
 * Distinct from a signal measured as zero, and the distinction is the point: a
 * patient who never opened the app has not failed their prep, and colouring
 * them red would teach the ward to ignore the colour.
 */
export const UNMEASURED = -1

const isMeasured = (v: number) => v >= 0

export const SIGNAL_NAMES: Readonly<Record<keyof Signals, string>> = {
  dietCompliance: 'Diet',
  prepTiming: 'Prep timing',
  fluidIntake: 'Fluids',
  bowelOutput: 'Bowel output',
}

export function scoreOf(signals: Signals): number | null {
  const keys = (Object.keys(WEIGHTS) as (keyof Signals)[]).filter((k) => isMeasured(signals[k]))
  if (keys.length === 0) return null
  const weight = keys.reduce((s, k) => s + WEIGHTS[k], 0)
  const score = keys.reduce((s, k) => s + signals[k] * WEIGHTS[k], 0)
  return score / weight
}

/**
 * Four signals in, one colour out.
 *
 * A critical signal that is on its own below the red line pulls the whole flag
 * red regardless of the mean, because the mean is exactly what would hide it: a
 * patient who drank every glass of water and skipped the second dose averages
 * out comfortably amber, and that is the patient whose list slot is about to be
 * wasted.
 */
export function computeFlag(signals: Signals, computedAt = new Date()): Flag {
  const score = scoreOf(signals)
  const reasons: string[] = []

  for (const key of Object.keys(WEIGHTS) as (keyof Signals)[]) {
    if (!isMeasured(signals[key])) reasons.push(`${SIGNAL_NAMES[key]} not recorded`)
    else if (signals[key] < RED_BELOW) reasons.push(`${SIGNAL_NAMES[key]} low`)
    else if (signals[key] < AMBER_BELOW) reasons.push(`${SIGNAL_NAMES[key]} below target`)
  }

  const criticalFailure =
    (isMeasured(signals.prepTiming) && signals.prepTiming < RED_BELOW) ||
    (isMeasured(signals.bowelOutput) && signals.bowelOutput < RED_BELOW)

  let colour: FlagColour
  if (score === null) {
    colour = 'amber'
    reasons.push('No prep data recorded')
  } else if (criticalFailure || score < RED_BELOW) {
    colour = 'red'
  } else if (score < AMBER_BELOW) {
    colour = 'amber'
  } else {
    colour = 'green'
  }

  return { colour, signals, reasons, computedAt: computedAt.toISOString() }
}

/**
 * What the flag means, said to the person reading it. The patient sentence
 * never implies the scope is cancelled -- that is not the app's call.
 */
export const FLAG_MEANING: Readonly<Record<FlagColour, string>> = {
  green: 'Your prep is on track. Come in as planned.',
  amber:
    'Something in your prep is worth a check. Bring this summary with you and mention it at admission.',
  red: 'Please call the endoscopy hospital/clinic before you travel. Do not take any extra preparation.',
}

export const FLAG_LABEL: Readonly<Record<FlagColour, string>> = {
  green: 'On track',
  amber: 'Worth a check',
  red: 'Call the hospital/clinic',
}

// ---------------------------------------------------------------------------
// What the patient can record
// ---------------------------------------------------------------------------

/**
 * The bowel-prep scale the hospitals already use, as the app reports it back.
 *
 * Deliberately the *hospital's* scale rather than an invented one: a patient
 * told "you want to be seeing 4 or above" can check that claim against the same
 * words the department uses.
 *
 * The swatches are the clarity ramp off the CW12 deck's cover -- the judgement
 * the deck argues a patient is asked to make alone, in a bathroom, at one in
 * the morning. They carry the information (how clear, how much sediment)
 * without asking anyone to photograph anything.
 */
export type BowelScalePoint = 1 | 2 | 3 | 4 | 5

export const BOWEL_SCALE: Record<
  BowelScalePoint,
  { label: string; meaning: string; clear: boolean; swatch: string }
> = {
  1: {
    label: 'Solid',
    meaning: 'Formed stool. The preparation has not started working yet.',
    clear: false,
    swatch: '#8A6A3A',
  },
  2: {
    label: 'Mostly solid',
    meaning: 'Still formed, some liquid. Keep going with the fluids.',
    clear: false,
    swatch: '#B08A4E',
  },
  3: {
    label: 'Cloudy liquid',
    meaning: 'Liquid with solid pieces. It is starting to work.',
    clear: false,
    swatch: '#CBA765',
  },
  4: {
    label: 'Light and cloudy',
    meaning: 'Mostly clear liquid with some cloudiness. This is close.',
    clear: true,
    swatch: '#E3CE8E',
  },
  5: {
    label: 'Clear',
    meaning: 'Clear or pale yellow liquid. This is what the team is looking for.',
    clear: true,
    swatch: '#F2E6B4',
  },
}

/** How the patient reports the diet day, and what each answer is worth. */
export const DIET_ANSWERS = [
  { id: 'yes', label: 'Stuck to it', value: 1 },
  { id: 'mostly', label: 'Mostly', value: 0.6 },
  { id: 'no', label: 'Slipped', value: 0.2 },
] as const

export type DietAnswer = (typeof DIET_ANSWERS)[number]['id']

/** Eight glasses through the day is the target the plan states. */
export const FLUID_TARGET_GLASSES = 8

/**
 * Clear fluid, per day: Singapore date (`yyyy-MM-dd`) → glasses.
 *
 * Per day because "glasses today" has to start again at zero tomorrow; one
 * running count carried Monday's glasses into Tuesday.
 */
export type FluidDays = Readonly<Record<string, number>>

export function fluidOn(days: FluidDays, date: string): number {
  return days[date] ?? 0
}

/**
 * The count the flag reads: the most recent day anything was recorded. On
 * procedure morning, before a glass is poured, that is the purge night -- the
 * day the ward is asking about.
 */
export function latestFluid(days: FluidDays): number | undefined {
  const recorded = Object.keys(days)
    .filter((date) => days[date] > 0)
    .sort()
  return recorded.length > 0 ? days[recorded[recorded.length - 1]] : undefined
}

/**
 * Turn what the patient recorded into the three signals they can move.
 *
 * `prepTiming` is not here: it comes from recorded dose volume, which is a
 * measurement rather than a self-report, and lives in `lib/progress.ts`.
 * Anything the patient has not recorded stays `UNMEASURED` rather than
 * becoming a zero -- silence is not a failed prep.
 */
export function signalsFromInput(input: {
  fluidGlasses?: number
  stoolPoint?: BowelScalePoint | null
  dietDays?: Record<string, DietAnswer>
}): Partial<Signals> {
  const out: { -readonly [K in keyof Signals]?: number } = {}

  if (typeof input.fluidGlasses === 'number' && input.fluidGlasses > 0) {
    out.fluidIntake = Math.min(1, input.fluidGlasses / FLUID_TARGET_GLASSES)
  }

  if (input.stoolPoint) {
    // Point 1 is no progress, point 5 is what the team is looking for.
    out.bowelOutput = (input.stoolPoint - 1) / 4
  }

  const days = Object.values(input.dietDays ?? {})
  if (days.length > 0) {
    const total = days.reduce(
      (sum, id) => sum + (DIET_ANSWERS.find((a) => a.id === id)?.value ?? 0),
      0,
    )
    out.dietCompliance = total / days.length
  }

  return out
}
