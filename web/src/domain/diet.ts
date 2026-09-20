import { DIET_FOODS } from './diet-foods.ts'

export const FOOD_CATEGORIES = [...new Set(DIET_FOODS.map(food => food.category))]

export type PrepDay = 'low-residue' | 'clear-liquid'
export type DietPreference = 'General' | 'Vegetarian' | 'Vegan'
export type FoodPhase = 'Both' | 'Low-residue days' | 'Clear-liquid day'
export type FoodStatus = 'Allowed' | 'Avoid' | 'Check hospital' | 'Check label'

export type FoodRecord = {
  readonly id: string
  readonly sourceRow: number
  readonly category: string
  readonly food: string
  readonly phase: FoodPhase
  readonly statuses: Readonly<Record<DietPreference, FoodStatus>>
  readonly notes: string
}

export type FoodGroup = {
  category: string
  allowed: FoodRecord[]
  avoid: FoodRecord[]
}

/** Check statuses are excluded before applying phase restrictions. */
export function foodStatus(food: FoodRecord, day: PrepDay, preference: DietPreference): 'Allowed' | 'Avoid' | null {
  const status = food.statuses[preference]
  if (status === 'Check hospital' || status === 'Check label') return null
  if (day === 'clear-liquid' && food.phase === 'Low-residue days') return 'Avoid'
  if (day === 'low-residue' && food.phase === 'Clear-liquid day' && status === 'Avoid') return null
  return status
}

export function getFoodGroups(day: PrepDay, preference: DietPreference, foods: readonly FoodRecord[] = DIET_FOODS): FoodGroup[] {
  const groups = new Map<string, FoodGroup>()
  for (const food of foods) {
    const status = foodStatus(food, day, preference)
    if (!status) continue
    let group = groups.get(food.category)
    if (!group) {
      group = { category: food.category, allowed: [], avoid: [] }
      groups.set(food.category, group)
    }
    group[status === 'Allowed' ? 'allowed' : 'avoid'].push(food)
  }
  return [...groups.values()]
}
