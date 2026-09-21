import { Card, SectionTitle } from '@/components/ui'
import { FLAG_COPY, readinessFlag, type DietRating, type PrepRating, type StoolRating } from '@/domain/readiness'

const LABELS = {
  diet: { good: 'Good · followed for all required days', partial: 'Partial · mostly followed', poor: 'Poor · largely not followed', unknown: 'Check-ins still needed' },
  prep: { good: 'Good · full preparation, on time', partial: 'Partial · timing off or still completing', poor: 'Poor · missed or incomplete preparation', unknown: 'Completion or timing not yet confirmed' },
  stool: { ready: 'Ready appearance · clear or pale-yellow liquid, no bits', almost: 'Almost · mostly clear with a few particles or light orange liquid', 'not-ready': 'Not ready appearance · brown, murky or solid', unknown: 'Procedure-morning check still needed or uncertain' },
}
export function ReadinessSummary({ diet, prep, stool, phone, concerning }: {
  diet: DietRating; prep: PrepRating; stool: StoolRating; phone?: string; concerning: boolean
}) {
  const colour = readinessFlag(prep, stool, diet)
  const copy = FLAG_COPY[colour]
  const ink = colour === 'green' ? 'text-flag-green' : colour === 'red' ? 'text-flag-red' : 'text-flag-amber'
  const missing = prep === 'unknown' || stool === 'unknown'
  return (
    <Card>
      <SectionTitle>04 · Overall bowel readiness</SectionTitle>
      <div role="status" aria-live="polite">
        <p className={`text-xs font-semibold uppercase tracking-[0.11em] ${ink}`}>{colour} flag · Based on saved check-ins</p>
        <h2 className={`mt-2 text-[24px] font-bold tracking-[-0.02em] ${ink}`}>{copy.title}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-muted">{copy.detail}</p>
      </div>
      <dl className="my-5 space-y-4 border-y border-hairline py-4 text-[15px]">
        <div><dt className="font-semibold text-ink">Purgative</dt><dd className="mt-1 text-ink-muted">{LABELS.prep[prep]}</dd></div>
        <div><dt className="font-semibold text-ink">Morning stool</dt><dd className="mt-1 text-ink-muted">{LABELS.stool[stool]}</dd></div>
        <div><dt className="font-semibold text-ink">Low-residue diet</dt><dd className="mt-1 text-ink-muted">{LABELS.diet[diet]}</dd></div>
      </dl>
      {colour === 'red' ? <p className="mb-3 text-[15px] text-ink-muted">{stool === 'not-ready' ? 'Your morning output is not yet clear.' : ''} {prep === 'poor' ? 'You reported a missed dose or incomplete preparation.' : ''}</p> : null}
      {colour === 'amber' ? <ul className="mb-4 list-disc space-y-2 pl-5 text-[15px] text-ink-muted">
        {missing ? <li>Complete or clarify the missing check-ins. Missing information is not the same as poor preparation.</li> : null}
        {prep === 'partial' ? <li>If you are still completing preparation, follow the remaining prescribed steps. Ask your team if timing has changed.</li> : null}
        <li>Follow your department’s clear-fluid and fasting instructions, including when to stop drinking.</li>
        <li>Re-check the latest output on procedure morning; colour or frequent trips alone do not confirm clarity.</li>
      </ul> : null}
      <p className="text-[15px] leading-relaxed text-ink-muted">{diet === 'good' ? 'You followed the diet — thank you for keeping track.' : diet === 'unknown' ? 'Add your diet check-ins when those days are complete.' : 'Tell your team about diet slips. Keep following the diet for your current prep stage.'} Diet alone does not change this flag.</p>
      {concerning ? <p className="mt-3 text-[15px] font-semibold text-ink">You reported very dark or blood-like output. Contact your care team, whatever the flag colour.</p> : null}
      {colour === 'red' || concerning ? (phone ? <a href={`tel:${phone}`} className="mt-4 flex min-h-[52px] items-center justify-center rounded-lg bg-blue px-4 font-semibold text-white">Contact the endoscopy team</a> : <p className="mt-4 text-[15px] font-semibold text-ink">Call the endoscopy team using the number on your appointment letter.</p>) : null}
      <p className="mt-5 text-[14px] leading-relaxed text-ink-faint">This flag supports a conversation with your care team. It does not decide whether your colonoscopy goes ahead. Do not take extra purgative based on this flag; your team decides any changes.</p>
    </Card>
  )
}
