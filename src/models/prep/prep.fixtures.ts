import type { Dose, FlagSignals, Profile } from './prep.types';

/**
 * The demo patient.
 *
 * These exist so the app runs on a fresh clone with no Supabase project: every
 * repository falls back here when `env.isBackendReady` is false. Keep them
 * realistic: a fixture that is tidier than real data hides the layout problems
 * real data will cause. Tan Ah Kow is 68, halal, allergic to shellfish, and
 * diabetic, because that combination is what feature 03 has to survive.
 */
export const DEMO_PROFILE: Profile = {
  displayName: 'Tan Ah Kow',
  language: 'en',
  reader: 'patient',
  yearOfBirth: 1958,
  dietaryPreferences: ['halal'],
  allergies: ['shellfish'],
  conditions: ['type 2 diabetes'],
  medicines: ['metformin', 'ferrous sulphate'],
};

/** Two days out, so the demo opens on the diet days rather than an empty wait. */
export function demoProcedureDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().slice(0, 10);
}

export const DEMO_PROCEDURE = {
  date: demoProcedureDate(),
  /**
   * The named clinic, not a generic department. "Endoscopy Centre" could be any
   * hospital in Singapore; a patient checking they are in the right building at
   * seven in the morning needs the one they were referred to.
   */
  hospital: 'SGH Endoscopy Clinic',
  /** Where in the building. Kept separate so it can be blank without reading oddly. */
  location: 'Block 3, Level 4',
  arriveAt: '07:30',
  departmentPhone: '+65 6222 3322',
};

/**
 * Before the purge night there is genuinely no timing or output to report, so
 * two of the four signals are `UNMEASURED` rather than zero.
 */
export const DEMO_SIGNALS: FlagSignals = {
  dietCompliance: 0.82,
  prepTiming: -1,
  fluidIntake: 0.64,
  bowelOutput: -1,
};

/**
 * Tonight's doses, as mutable in-memory state.
 *
 * Deliberately not a frozen constant. With no backend, `recordDoseProgress` has
 * nowhere to write, so an optimistic update was immediately reverted by the
 * refetch that followed it: tapping "one glass" moved the bar for a frame and
 * then snapped back to zero. In the mode most people will first run this in,
 * the central interaction did nothing.
 *
 * This is demo state and it behaves like it: it lives for the lifetime of the
 * JS context and resets on reload. Real persistence is the Supabase path.
 */
const DEMO_DOSE_SEED: Dose[] = [
  {
    id: 'dose-1',
    label: 'First dose',
    scheduledAt: '18:00',
    volumeMl: 1000,
    consumedMl: 0,
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'dose-2',
    label: 'Second dose',
    scheduledAt: '02:00',
    volumeMl: 1000,
    consumedMl: 0,
    startedAt: null,
    completedAt: null,
  },
];

let demoDoses: Dose[] = DEMO_DOSE_SEED.map((dose) => ({ ...dose }));

export function readDemoDoses(): Dose[] {
  return demoDoses.map((dose) => ({ ...dose }));
}

/** Clamped here as well as in the table: the app must never record an overdose. */
export function writeDemoDose(doseId: string, consumedMl: number): void {
  demoDoses = demoDoses.map((dose) =>
    dose.id === doseId
      ? {
          ...dose,
          consumedMl: Math.max(0, Math.min(consumedMl, dose.volumeMl)),
          completedAt: consumedMl >= dose.volumeMl ? new Date().toISOString() : null,
        }
      : dose,
);
}
