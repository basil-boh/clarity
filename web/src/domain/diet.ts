/**
 * The low-residue diet, ported from the Expo app's DietScreen.
 *
 * Written in the food the patient actually eats rather than in food groups:
 * "mee hoon" and "plain porridge", not "refined carbohydrates". That is the
 * whole argument of feature 03 — a printed sheet cannot answer what a patient
 * of this culture actually eats, and a screen that renders four abstract food
 * groups for everyone is a leaflet with a nicer typeface.
 *
 * Scaffold content, not clinical guidance: the real list comes from the
 * department, and guidance differs between hospitals here and overseas.
 */

export type FoodGroup = {
  readonly id: string
  /** Lucide glyph name; see `components/Icon.tsx`. */
  readonly icon: string
  readonly label: string
  readonly title: string
  readonly allowed: readonly string[]
  readonly avoid: readonly string[]
}

export const FOOD_GROUPS: readonly FoodGroup[] = [
  {
    id: 'grains',
    icon: 'wheat',
    label: 'Grains',
    title: 'Rice, noodles and bread',
    allowed: ['White rice', 'Plain porridge', 'Mee hoon', 'White bread', 'Plain biscuits'],
    avoid: ['Brown rice', 'Wholemeal bread', 'Oats', 'Muesli', 'Barley'],
  },
  {
    id: 'protein',
    icon: 'fish',
    label: 'Protein',
    title: 'Meat, fish and eggs',
    allowed: ['Steamed fish', 'Chicken, no skin', 'Eggs', 'Tofu', 'Minced pork'],
    avoid: ['Anything with nuts', 'Tough or fatty cuts', 'Fish with bones in'],
  },
  {
    id: 'produce',
    icon: 'carrot',
    label: 'Vegetables',
    title: 'Vegetables and fruit',
    allowed: ['Clear soup', 'Well-cooked marrow', 'Peeled potato', 'Peeled pumpkin'],
    avoid: ['Skins and seeds', 'Leafy greens', 'Sweetcorn', 'Raw fruit', 'Beans'],
  },
  {
    id: 'fluids',
    icon: 'glass-water',
    label: 'Drinks',
    title: 'What to drink',
    allowed: ['Water', 'Clear tea', 'Strained barley', 'Isotonic drinks'],
    avoid: ['Milk', 'Anything red or purple', 'Juice with pulp'],
  },
] as const

/** The three rules that cut across every group. */
export const DIET_RULES = [
  { icon: 'nut', label: 'No nuts or seeds' },
  { icon: 'cookie', label: 'No skins or husks' },
  { icon: 'milk', label: 'No milk or cream' },
] as const

/**
 * Why red and purple are singled out.
 *
 * Patients read "no red drinks" as a fussy rule and ignore it. It is the one
 * diet rule with a direct effect on the procedure, so it is stated with its
 * reason rather than as a prohibition.
 */
export const RED_NOTE =
  'Anything red or purple can stain the bowel lining and be mistaken for blood during the scope. That is the reason for the rule.'
