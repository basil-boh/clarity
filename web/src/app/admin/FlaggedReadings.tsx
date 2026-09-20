import Link from 'next/link'
import { format, parseISO } from 'date-fns'

import { Card } from '@/components/ui'
import { BOWEL_SCALE } from '@/domain/progress'
import { FLAG_REASON_COPY } from '@/domain/verification'
import { formatPhone } from '@/lib/phone'
import { flaggedVerifications } from '@/lib/verification-store'

/**
 * What a person should look at, at the top of the patient list.
 *
 * Above the list rather than a column in it, because it answers a different
 * question. The list is "who is booked"; this is "who is not going well
 * tonight", and on a purge night that is the only question worth asking.
 *
 * It renders nothing when nothing is flagged. A permanently visible empty
 * panel teaches people to stop looking at that part of the screen.
 */
export async function FlaggedReadings() {
  const flagged = await flaggedVerifications(20)
  if (flagged.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-flag-red">
        Needs a look · {flagged.length}
      </h2>
      <Card className="p-0">
        <ul className="divide-y divide-hairline">
          {flagged.map((reading) => {
            // The accepted point is what the patient actually recorded; the
            // suggested one is what the photograph looked like to the model.
            // Both are shown, because where they differ is the whole point.
            const recorded = reading.acceptedPoint
            const suggested = reading.suggestedPoint

            return (
              <li key={reading.id} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/admin/patients/${encodeURIComponent(reading.phone)}`}
                    className="text-[17px] font-semibold text-blue"
                  >
                    {formatPhone(reading.phone)}
                  </Link>
                  <span className="font-mono text-[13px] tabular-nums text-ink-faint">
                    {format(parseISO(reading.assessedAt), 'd MMM HH:mm')}
                  </span>
                </div>

                <p className="mt-1.5 text-[15px] text-ink">
                  {recorded !== null ? (
                    <>
                      Recorded <strong>{recorded}</strong> · {BOWEL_SCALE[recorded].label}
                    </>
                  ) : (
                    <span className="text-ink-muted">Not yet confirmed by the patient</span>
                  )}
                  {suggested !== null && suggested !== recorded ? (
                    <span className="text-ink-muted">
                      {' '}
                      · photograph read as {suggested}
                    </span>
                  ) : null}
                  {reading.usable ? (
                    <span className="text-ink-faint">
                      {' '}
                      · {Math.round(reading.confidence * 100)}% confident
                    </span>
                  ) : null}
                </p>

                <ul className="mt-1.5 space-y-0.5">
                  {reading.reasons.map((reason) => (
                    <li key={reason} className="text-[15px] leading-relaxed text-ink-muted">
                      {FLAG_REASON_COPY[reason]}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </Card>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-faint">
        A reading of a photograph against the department&rsquo;s scale, not an assessment of whether
        anyone is ready. No image is kept.
      </p>
    </section>
  )
}
