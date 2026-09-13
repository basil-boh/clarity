import type { FlagColour } from '@/theme';

/**
 * The domain, in one file.
 *
 * The shape of everything here comes from one finding in the CW12 interviews:
 * *diet is the experience, the purgative is the outcome*. Clinicians were
 * unanimous that finishing the full volume at the right time is what decides
 * whether the bowel is clean; the three diet days are what decide whether the
 * patient is willing to come back in two years. Those are different problems,
 * so they are different types, and the app never averages one into the other.
 */

// ---------------------------------------------------------------------------
// The patient
// ---------------------------------------------------------------------------

/**
 * The four languages the plan is written in.
 *
 * Feature 02. Nurses named language and comprehension as a leading cause of
 * poor preparation, so this is not a localisation nicety bolted on at the end:
 * the *diet plan itself* is generated in the patient's language, which is why
 * this sits in the domain rather than in an i18n config.
 */
export type Language = 'en' | 'zh' | 'ms' | 'ta';

/** Who is actually holding the phone. Over 70, it is frequently not the patient. */
export type Reader = 'patient' | 'caregiver';

/**
 * The profile the diet plan is built from (feature 03).
 *
 * A printed sheet cannot answer two questions: what a patient of this culture
 * actually eats, and what this individual can safely eat. Everything below
 * exists to close one of those two gaps.
 */
export type Profile = {
  readonly displayName: string;
  readonly language: Language;
  readonly reader: Reader;
  readonly yearOfBirth: number;
  /** Free text, deliberately: "halal", "no beef", "vegetarian on Fridays". */
  readonly dietaryPreferences: readonly string[];
  readonly allergies: readonly string[];
  /**
   * Conditions that change the prep, not the full medical history. Renal and
   * cardiac disease matter most: they are why the app must never suggest an
   * extra dose. See `NEVER` in `features/flag/rules`.
   */
  readonly conditions: readonly string[];
  /** Medicines that may need holding before the scope. Clinician-confirmed. */
  readonly medicines: readonly string[];
};

/** Where to be, when, and who to call. All of it comes from the department. */
export type Procedure = {
  /** ISO date, `yyyy-MM-dd`. The whole plan is derived from this one value. */
  readonly date: string;
  /** The named clinic, e.g. "SGH Endoscopy Clinic". */
  readonly hospital: string;
  /**
   * Where in the building, e.g. "Block 3, Level 4". Separate from `hospital` so
   * a site that has no block or level renders as a clean name rather than a
   * name with a dangling comma.
   */
  readonly location: string;
  /** Local wall-clock time, `HH:mm`. */
  readonly arriveAt: string;
  readonly departmentPhone: string;
};

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

/**
 * Where the patient is in the run-up, as a named phase rather than a date
 * arithmetic result scattered across screens.
 *
 * `waiting` can last two years (the sheet is handed over at the referral and
 * never revisited) which is exactly the stretch a leaflet cannot survive and
 * an app can.
 */
export type Phase =
  | 'waiting'
  | 'week_before'
  | 'diet_day'
  | 'purge_night'
  | 'procedure_day'
  | 'done';

/** A step on the plan: one thing to do, at one time, on one day. */
export type StepKind = 'diet' | 'fluid' | 'medicine' | 'purgative' | 'admin';

export type Step = {
  readonly id: string;
  readonly kind: StepKind;
  readonly title: string;
  readonly detail?: string;
  /** Local wall-clock time, `HH:mm`. Null for "some time today". */
  readonly at: string | null;
  /**
   * Whether missing this changes the outcome. Only purgative timing and volume
   * are `critical`; everything else is `advised`. The flag weights them
   * differently and so does the alert schedule.
   */
  readonly weight: 'critical' | 'advised';
  readonly done: boolean;
};

export type PlanDay = {
  /** Days until the procedure. 0 is the morning of; negatives are the run-up. */
  readonly offset: number;
  readonly date: string;
  readonly phase: Phase;
  readonly heading: string;
  readonly steps: readonly Step[];
};

// ---------------------------------------------------------------------------
// The purgative (features 06, 07)
// ---------------------------------------------------------------------------

/**
 * One dose of the bowel preparation.
 *
 * `volumeMl` is stated, tracked and shown because "finish the full volume" was
 * the single thing every clinician in the interviews agreed on, and on paper it
 * gets one line.
 */
export type Dose = {
  readonly id: string;
  readonly label: string;
  readonly scheduledAt: string;
  readonly volumeMl: number;
  readonly consumedMl: number;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
};

/**
 * The Bristol-style bowel-prep scale the hospitals already use, as the app
 * reports it back.
 *
 * Deliberately the *hospital's* scale rather than an invented one: a patient
 * who has been told "you want to be seeing 4 or above" can check that claim
 * against the same words the department uses.
 */
export type BowelScalePoint = 1 | 2 | 3 | 4 | 5;

export type StoolReading = {
  readonly id: string;
  readonly at: string;
  readonly point: BowelScalePoint;
  /**
   * 0–1. Always shown. The gastroenterologist's condition for letting a model
   * near this was that nobody mistakes an estimate for a finding, so a reading
   * is never rendered without it.
   */
  readonly confidence: number;
  /** True when the model declined to call it. The UI must handle this. */
  readonly inconclusive: boolean;
};

// ---------------------------------------------------------------------------
// The meal check (feature 04)
// ---------------------------------------------------------------------------

export type MealVerdict = 'ok' | 'avoid' | 'unsure';

export type MealCheck = {
  readonly id: string;
  readonly at: string;
  readonly verdict: MealVerdict;
  readonly confidence: number;
  /** What was recognised, in the patient's own language. */
  readonly items: readonly string[];
  /** Why, in one sentence. "Peanuts and coconut rice leave residue." */
  readonly reason: string;
};

// ---------------------------------------------------------------------------
// The flag (feature 09)
// ---------------------------------------------------------------------------

/** The four signals in. Each is 0–1, and each is a measurement, not a guess. */
export type FlagSignals = {
  readonly dietCompliance: number;
  readonly prepTiming: number;
  readonly fluidIntake: number;
  readonly bowelOutput: number;
};

/**
 * The one flag out.
 *
 * `reasons` is not decoration. Four of the seven staff interviewed chose a
 * single flag over seeing food or stool photographs, and the reason they gave
 * was triage speed, but a flag with no basis is just a different guess. The
 * nurse gets the colour first and the four numbers behind it on the same
 * screen.
 */
export type PrepFlag = {
  readonly colour: FlagColour;
  readonly signals: FlagSignals;
  readonly reasons: readonly string[];
  readonly computedAt: string;
};
