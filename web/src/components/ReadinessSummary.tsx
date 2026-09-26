'use client'

import { useI18n } from '@/components/I18nProvider'
import { Card, SectionTitle } from '@/components/ui'
import { FLAG_COPY, readinessFlag, type PrepRating, type StoolRating } from '@/domain/readiness'

const LABELS = {
  prep: { good: 'Good · full preparation, on time', partial: 'Partial · timing off or still completing', poor: 'Poor · missed or incomplete preparation', unknown: 'Completion or timing not yet confirmed' },
  stool: { ready: 'Ready appearance · clear or pale-yellow liquid, no bits', almost: 'Almost · mostly clear with a few particles or light orange liquid', 'not-ready': 'Not ready appearance · brown, murky or solid', unknown: 'Procedure-morning check still needed or uncertain' },
}
export function ReadinessSummary({ prep, stool, phone, concerning }: {
  prep: PrepRating; stool: StoolRating; phone?: string; concerning: boolean
}) {
  const { tx } = useI18n()

  const colour = readinessFlag(prep, stool, 'unknown')
  const copy = FLAG_COPY[colour]
  const ink = colour === 'green' ? 'text-flag-green' : colour === 'red' ? 'text-flag-red' : 'text-flag-amber'
  const missing = prep === 'unknown' || stool === 'unknown'
  return (
    <Card>
      <SectionTitle>{tx("03 · Overall bowel readiness")}</SectionTitle>
      <div role="status" aria-live="polite">
        <p className={`text-xs font-semibold uppercase tracking-[0.11em] ${ink}`}>{tx(colour)}{' '}{tx("flag · Based on saved check-ins")}</p>
        <h2 className={`mt-2 text-[24px] font-bold tracking-[-0.02em] ${ink}`}>{tx(copy.title)}</h2>
        <p className="mt-3 text-[16px] leading-relaxed text-ink-muted">{tx(copy.detail)}</p>
      </div>
      <dl className="my-5 space-y-4 border-y border-hairline py-4 text-[15px]">
        <div><dt className="font-semibold text-ink">{tx("Purgative")}</dt><dd className="mt-1 text-ink-muted">{tx(LABELS.prep[prep])}</dd></div>
        <div><dt className="font-semibold text-ink">{tx("Morning stool")}</dt><dd className="mt-1 text-ink-muted">{tx(LABELS.stool[stool])}</dd></div>
      </dl>
      {colour === 'red' ? <p className="mb-3 text-[15px] text-ink-muted">{tx(stool === 'not-ready' ? 'Your morning output is not yet clear.' : '')} {tx(prep === 'poor' ? 'You reported a missed dose or incomplete preparation.' : '')}</p> : null}
      {colour === 'amber' ? <ul className="mb-4 list-disc space-y-2 pl-5 text-[15px] text-ink-muted">
        {missing ? <li>{tx("Complete or clarify the missing check-ins. Missing information is not the same as poor preparation.")}</li> : null}
        {prep === 'partial' ? <li>{tx("If you are still completing preparation, follow the remaining prescribed steps. Ask your team if timing has changed.")}</li> : null}
        <li>{tx("Follow your hospital/clinic’s clear-fluid and fasting instructions, including when to stop drinking.")}</li>
        <li>{tx("Re-check the latest output on procedure morning; colour or frequent trips alone do not confirm clarity.")}</li>
      </ul> : null}
      {concerning ? <p className="text-[15px] font-semibold text-ink">{tx("You reported very dark or blood-like output. Contact your care team, whatever the flag colour.")}</p> : null}
      {colour === 'red' || concerning ? (phone ? <a href={`tel:${phone}`} className="mt-4 flex min-h-[52px] items-center justify-center rounded-lg bg-blue px-4 font-semibold text-white">{tx("Contact the endoscopy team")}</a> : <p className="mt-4 text-[15px] font-semibold text-ink">{tx("Call the endoscopy team using the number on your appointment letter.")}</p>) : null}
      <p className="mt-5 text-[14px] leading-relaxed text-ink-faint">{tx("This flag supports a conversation with your care team. It does not decide whether your colonoscopy goes ahead. Do not take extra purgative based on this flag; your team decides any changes.")}</p>
    </Card>
  )
}
