/** Patient observations: colour and toilet frequency never determine clarity. */
export const REASONS = {
  colour: 'The colour looks different',
  frequency: 'I have been to the toilet many times',
  appearance: 'The latest output looks watery and clear',
  unsure: 'I am not sure what to look for',
} as const
export const COLOURS = {
  yellow: 'Pale yellow',
  green: 'Yellow-green',
  orange: 'Light orange',
  brown: 'Brown',
  dark: 'Very dark or black',
  red: 'Red or blood-like',
  colourless: 'Almost colourless',
  unsure: 'I cannot tell',
} as const
export const CONSISTENCIES = {
  solid: 'Formed or mostly solid',
  pieces: 'Liquid with solid pieces',
  flecks: 'Mostly liquid, with a few small particles',
  watery: 'Watery, with no solid pieces',
  unsure: 'I cannot tell',
} as const
export const CLARITIES = {
  clear: 'See-through — I can see through the liquid',
  cloudy: 'Cloudy — I cannot see through it clearly',
  unsure: 'I cannot tell',
} as const
export type StoolCheck = {
  recordedAt?: string
  procedureDate?: string
  reason: keyof typeof REASONS
  colour: keyof typeof COLOURS
  consistency: keyof typeof CONSISTENCIES
  clarity: keyof typeof CLARITIES | null
}
const has = (map: object, key: unknown): boolean => typeof key === 'string' && Object.hasOwn(map, key)
export function parseStoolCheck(value: unknown): StoolCheck | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (!has(REASONS, raw.reason) || !has(COLOURS, raw.colour) || !has(CONSISTENCIES, raw.consistency)) return null
  if ((raw.consistency === 'watery' || raw.consistency === 'flecks') ? !has(CLARITIES, raw.clarity) : raw.clarity !== null) return null
  return { reason: raw.reason, colour: raw.colour, consistency: raw.consistency, clarity: raw.clarity,
    ...(typeof raw.recordedAt === 'string' && Number.isFinite(Date.parse(raw.recordedAt)) ? { recordedAt: raw.recordedAt } : {}),
    ...(typeof raw.procedureDate === 'string' ? { procedureDate: raw.procedureDate } : {}),
  } as StoolCheck
}
export const REASON_HINTS: Record<StoolCheck['reason'], string> = {
  colour: 'Colour is only one clue. Let’s check whether the latest output is watery and see-through.',
  frequency: 'Many toilet trips do not tell us whether the bowel is clear. Let’s look at the output from your latest trip.',
  appearance: 'Those are useful things to notice. Let’s check the latest output, including whether any pieces remain.',
  unsure: 'We will check one thing at a time: colour, solid pieces, then whether you can see through the liquid.',
}
/** Preserve the existing scale without inventing a colour-derived readiness score. */
export function stoolPointFor(check: StoolCheck): 1 | 3 | 5 | null {
  if (check.colour === 'dark' || check.colour === 'red') return null
  if (check.consistency === 'solid') return 1
  if (check.consistency === 'pieces' || check.consistency === 'flecks') return 3
  if (check.consistency !== 'watery') return null
  if (check.clarity === 'clear') return 5
  // The legacy point 4 means mostly clear with slight cloudiness.
  // A generic ‘cloudy’ answer cannot establish that, so keep it unscored.
  return null
}
export function guidanceFor(check: StoolCheck): { title: string; detail: string; contact: boolean } {
  if (check.colour === 'dark' || check.colour === 'red') return {
    title: 'Check this with your clinical team',
    detail: 'Do not assume very dark, black or red output is caused by food or iron, even if it is watery or you have been many times. See Overall bowel readiness in the Readiness tab for what to do.',
    contact: true,
  }
  if (check.consistency === 'unsure' || (check.consistency === 'watery' && check.clarity === 'unsure')) return {
    title: 'It is okay to be unsure',
    detail: 'On your next trip, look for solid pieces and whether you can see through the liquid. If you still cannot tell, record “I cannot tell”.',
    contact: true,
  }
  if (check.consistency !== 'watery') return {
    title: 'You are still seeing solid material',
    detail: 'The latest output is not yet watery and clear. Follow your prescribed plan and check again after your next trip.',
    contact: true,
  }
  if (check.clarity === 'cloudy') return {
    title: 'Watery, but still cloudy',
    detail: 'Watery and see-through are different. Cloudy liquid can still contain material. Follow your prescribed plan and check again after your next trip.',
    contact: true,
  }
  return {
    title: 'You described watery, see-through output',
    detail: 'That describes clarity, not confirmation that you are ready. Complete your preparation as prescribed and follow your hospital/clinic’s instructions.',
    contact: false,
  }
}
