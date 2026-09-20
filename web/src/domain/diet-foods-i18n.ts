import type { FoodRecord, FoodStatus } from './diet.ts'
import type { Language } from './i18n.ts'

/**
 * The food guide in the patient's language.
 *
 * Held apart from `diet-foods.ts` because that file is generated: the header
 * says so, and `npm run import:diet` rewrites it wholesale from the
 * department's workbook. Translations kept inside it would be destroyed the
 * first time the food list was updated, which is exactly when nobody would
 * think to check.
 *
 * Translation is per record id, and anything missing falls back to the English
 * record rather than to a blank. A patient who meets one untranslated food
 * name has lost nothing; a patient who meets an empty row has lost the
 * instruction.
 */

export type FoodTranslation = {
  readonly foods: Readonly<Record<string, { readonly food: string; readonly notes?: string }>>
  readonly categories: Readonly<Record<string, string>>
  readonly statuses: Readonly<Record<string, string>>
}

/**
 * Loaded through a lookup rather than imported by the screens, so only the
 * language actually being rendered crosses to the browser. The Diet page
 * translates the records on the server and hands the result to `MealList`;
 * shipping all four would be four times the food list for no one's benefit.
 */
const TRANSLATIONS: Partial<Record<Language, () => Promise<FoodTranslation>>> = {
  zh: async () => (await import('@/messages/foods/zh')).zhFoods,
  ms: async () => (await import('@/messages/foods/ms')).msFoods,
  ta: async () => (await import('@/messages/foods/ta')).taFoods,
}

export async function foodTranslation(language: Language): Promise<FoodTranslation | null> {
  const load = TRANSLATIONS[language]
  return load ? load() : null
}

/** One record in the given language, falling back field by field to English. */
export function translateRecord(record: FoodRecord, into: FoodTranslation | null): FoodRecord {
  const found = into?.foods[record.id]
  if (!into || !found) return record
  return {
    ...record,
    food: found.food || record.food,
    category: into.categories[record.category] || record.category,
    // An empty translated note means the source had none, not that one was
    // lost: the generator only writes `notes` when the English had text.
    notes: record.notes ? found.notes || record.notes : '',
  }
}

export function translateRecords(
  records: readonly FoodRecord[],
  into: FoodTranslation | null,
): FoodRecord[] {
  return records.map((record) => translateRecord(record, into))
}

export function translateStatus(status: FoodStatus, into: FoodTranslation | null): string {
  return into?.statuses[status] || status
}

export function translateCategory(category: string, into: FoodTranslation | null): string {
  return into?.categories[category] || category
}
