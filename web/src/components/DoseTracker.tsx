'use client'

import { useI18n } from '@/components/I18nProvider'

import { useState, useTransition } from 'react'

import { GLASS_ML, type Dose } from '@/domain/prep'

/**
 * How much of the preparation has actually gone down.
 *
 * The one number in this app that changes the outcome, so it gets the plainest
 * possible input: one button, one glass. Not a slider — at 1am a tired patient
 * can answer "how many glasses have I got through", not "what percentage of
 * 1000ml". `GLASS_ML` is the unit they actually pour.
 *
 * **It clamps at the prescribed volume and will not go past it.** The app never
 * helps a patient drink more than they were told to; a counter that runs on to
 * 1250 of 1000ml is quietly telling them that was fine. See `NEVER` in
 * `domain/progress.ts`.
 *
 * Updates optimistically, because on a hospital guest network at 1am a patient
 * who taps and sees nothing happen will tap again — and how much went down is
 * precisely what this exists to measure. The server's answer wins on settle.
 */
export function DoseTracker({
  dose,
  consumedMl,
  onRecord,
}: {
  dose: Dose
  consumedMl: number
  onRecord: (doseId: string, ml: number) => Promise<number>
}) {
  const { tx } = useI18n()

  const [optimistic, setOptimistic] = useState(consumedMl)
  const [pending, startTransition] = useTransition()

  const glasses = Math.round(optimistic / GLASS_ML)
  const totalGlasses = Math.round(dose.volumeMl / GLASS_ML)
  const done = optimistic >= dose.volumeMl

  function change(delta: number) {
    const next = Math.max(0, Math.min(optimistic + delta * GLASS_ML, dose.volumeMl))
    if (next === optimistic) return
    setOptimistic(next)
    startTransition(async () => {
      const confirmed = await onRecord(dose.id, next)
      setOptimistic(confirmed)
    })
  }

  return (
    <div className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[19px] font-semibold tracking-[-0.018em] text-ink">{tx(dose.label)}</h3>
        <span className="bg-blue px-2 py-1 font-mono text-[13px] font-medium tabular-nums text-white">
          {tx(dose.at)}
        </span>
      </div>

      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{tx(dose.note)}</p>

      {/* One cell per glass: the eye counts glasses, not millilitres. */}
      <div
        className="mt-4 flex gap-[3px]"
        role="img"
        aria-label={tx(`${glasses} of ${totalGlasses} glasses recorded`)}
      >
        {Array.from({ length: totalGlasses }, (_, i) => (
          <span
            key={i}
            className={`h-6 flex-1 ${i < glasses ? 'bg-blue' : 'border border-hairline bg-paper'}`}
          />
        ))}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-faint">
          {tx('{0} of {1} ml', { 0: optimistic, 1: dose.volumeMl })}</span>
        {done ? (
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-flag-green">{tx("Full volume done")}</span>
        ) : (
          <span className="font-mono text-[12px] tabular-nums text-ink-faint">
            {tx('{0} / {1} glasses', { 0: glasses, 1: totalGlasses })}</span>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => change(1)}
          disabled={done}
          className="min-h-[52px] flex-1 bg-blue px-4 text-[17px] font-semibold text-white transition-colors hover:bg-blue-deep disabled:cursor-not-allowed disabled:bg-paper-sunken disabled:text-ink-faint"
        >
          {tx(done ? 'All finished' : 'I drank a glass')}
        </button>
        <button
          type="button"
          onClick={() => change(-1)}
          disabled={optimistic <= 0}
          className="min-h-[52px] border border-hairline-strong px-5 text-[17px] font-semibold text-ink transition-colors hover:bg-paper-sunken disabled:cursor-not-allowed disabled:text-ink-faint"
          aria-label={tx("Undo one glass")}
        >{tx("Undo")}</button>
      </div>

      <p aria-live="polite" className="sr-only">
        {tx(pending ? 'Saving' : `${glasses} of ${totalGlasses} glasses recorded`)}
      </p>
    </div>
  )
}
