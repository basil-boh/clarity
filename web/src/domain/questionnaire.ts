/**
 * The questions asked once, at a patient's first sign-in.
 *
 * Every one is optional and every one has "Prefer not to say", stored as null:
 * ethnicity and religion-adjacent diet are sensitive, and a patient must be
 * able to reach their prep instructions without answering anything.
 *
 * Only ethnicity and diet change what the app shows -- the Diet page, in
 * `domain/diet.ts`. Age and gender are kept for the department and change
 * nothing on screen: there is no basis for a different low-residue diet by
 * either, and this app does not invent one.
 */

export const AGE_RANGES = [
  { id: 'under-40', label: 'Under 40' },
  { id: '40-49', label: '40 to 49' },
  { id: '50-59', label: '50 to 59' },
  { id: '60-69', label: '60 to 69' },
  { id: '70-79', label: '70 to 79' },
  { id: '80-plus', label: '80 or over' },
] as const

export const GENDERS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Another gender' },
] as const

/** Singapore's four census groups, which is how patients here describe themselves. */
export const ETHNICITIES = [
  { id: 'chinese', label: 'Chinese' },
  { id: 'malay', label: 'Malay' },
  { id: 'indian', label: 'Indian' },
  { id: 'other', label: 'Other' },
] as const

export const DIETS = [
  { id: 'halal', label: 'Halal', hint: 'No pork, and halal meat' },
  { id: 'vegetarian', label: 'Vegetarian', hint: 'No meat or fish' },
  { id: 'vegan', label: 'Vegan', hint: 'No meat, fish, eggs or dairy' },
  { id: 'no-pork', label: 'No pork', hint: null },
  { id: 'no-beef', label: 'No beef', hint: null },
] as const

export type AgeRange = (typeof AGE_RANGES)[number]['id']
export type Gender = (typeof GENDERS)[number]['id']
export type Ethnicity = (typeof ETHNICITIES)[number]['id']
export type Diet = (typeof DIETS)[number]['id']

export type Answers = {
  readonly ageRange: AgeRange | null
  readonly gender: Gender | null
  readonly ethnicity: Ethnicity | null
  /** Empty means no restrictions. */
  readonly diets: readonly Diet[]
}

export const NO_ANSWERS: Answers = { ageRange: null, gender: null, ethnicity: null, diets: [] }

function oneOf<T extends string>(options: readonly { id: T }[], value: unknown): T | null {
  return options.find((option) => option.id === value)?.id ?? null
}

/**
 * Answers from anywhere -- a form post, a database row -- kept only where they
 * are one of the options. Anything else is dropped, never guessed at.
 */
export function parseAnswers(raw: {
  ageRange?: unknown
  gender?: unknown
  ethnicity?: unknown
  diets?: unknown
}): Answers {
  const picked = Array.isArray(raw.diets) ? raw.diets : []
  const diets = DIETS.map((diet) => diet.id).filter((id) => picked.includes(id))
  return {
    ageRange: oneOf(AGE_RANGES, raw.ageRange),
    gender: oneOf(GENDERS, raw.gender),
    ethnicity: oneOf(ETHNICITIES, raw.ethnicity),
    diets,
  }
}

const labelOf = (options: readonly { id: string; label: string }[], id: string | null) =>
  options.find((option) => option.id === id)?.label ?? null

/** For the staff view: each answer as a word, or null if not given. */
export function describeAnswers(answers: Answers) {
  return {
    age: labelOf(AGE_RANGES, answers.ageRange),
    gender: labelOf(GENDERS, answers.gender),
    ethnicity: labelOf(ETHNICITIES, answers.ethnicity),
    diets: answers.diets.map((id) => labelOf(DIETS, id)!),
  }
}
