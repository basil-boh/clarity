import type { StoolCheck } from './stool-check'

export type DietRating = 'good' | 'partial' | 'poor' | 'unknown'
export type PrepRating = 'good' | 'partial' | 'poor' | 'unknown'
export type StoolRating = 'ready' | 'almost' | 'not-ready' | 'unknown'
export type ReadinessColour = 'green' | 'amber' | 'red'

/** Ordered rules, not a weighted average. Diet never changes the colour. */
export function readinessFlag(prep: PrepRating, stool: StoolRating, _diet: DietRating): ReadinessColour {
  if (stool === 'not-ready' || prep === 'poor') return 'red'
  if (stool === 'ready' && prep === 'good') return 'green'
  return 'amber'
}
export function dietRating(days: Record<string, string>): DietRating {
  const answers = [-3, -2, -1].map(day => days[String(day)])
  if (answers.some(answer => !answer)) return 'unknown'
  if (answers.every(answer => answer === 'yes')) return 'good'
  if (answers.filter(answer => answer === 'no').length >= 2) return 'poor'
  return 'partial'
}
export const PREP_REPORTS = {
  records: 'Use my dose and timing records',
  completing: 'I am behind schedule but still completing the prep',
  late: 'I took the full preparation, but the timing was off',
  incomplete: 'I missed a dose or stopped without completing it',
} as const
export type PrepReport = keyof typeof PREP_REPORTS
export function prepRating(doses: readonly { id: string; volumeMl: number }[], volumes: Record<string, number>, completed: readonly string[]): PrepRating {
  if (completed.includes('-1:readiness-incomplete')) return 'poor'
  if (completed.includes('-1:readiness-completing') || completed.includes('-1:readiness-late')) return 'partial'
  if (doses.length > 0 && doses.every(dose => (volumes[dose.id] ?? 0) >= dose.volumeMl && completed.includes(`-1:timing-${dose.id}`))) return 'good'
  // An empty or partial log is not evidence that the patient stopped taking prep.
  return 'unknown'
}
export function stoolRating(check: StoolCheck | null | undefined, isMorning: boolean): StoolRating {
  if (!check || !isMorning) return 'unknown'
  if (check.colour === 'brown' || check.consistency === 'solid' || check.consistency === 'pieces' || check.clarity === 'cloudy') return 'not-ready'
  if (check.consistency === 'unsure' || check.clarity === 'unsure' || check.colour === 'unsure' || check.colour === 'dark' || check.colour === 'red') return 'unknown'
  if (check.clarity !== 'clear') return 'unknown'
  if (check.colour === 'orange' && (check.consistency === 'watery' || check.consistency === 'flecks')) return 'almost'
  if (check.consistency === 'flecks') return 'almost'
  if (check.consistency === 'watery' && (check.colour === 'yellow' || check.colour === 'colourless')) return 'ready'
  return 'unknown'
}
export const FLAG_COPY = {
  green: { title: 'On track', detail: 'Your morning stool check and completed, on-time preparation are on track. Follow the final steps in your hospital/clinic’s instructions.' },
  amber: { title: 'A little more to check', detail: 'Review the items below. Follow your prescribed preparation and fluid cut-off instructions, and check your latest stool again on the morning of your procedure.' },
  red: { title: 'Preparation may not be complete', detail: 'Please contact your endoscopy team for advice. They can review your preparation with you.' },
} as const
