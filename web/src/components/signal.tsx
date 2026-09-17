import { gradeOf, type FlagColour } from '@/domain/progress'

/**
 * Prep readiness, drawn the way the CW12 deck draws things.
 *
 * The first pass of this was a rounded pill with a tinted background and a
 * rounded progress bar underneath — the default shape of every dashboard, and
 * it made a clinical signal look like a growth metric. Everything here is flat:
 * rules, solid blocks and mono type, no radius, no tint, no shadow.
 *
 * Two rules carried over from the theme and worth restating:
 *
 * **Green, amber and red mean prep readiness and nothing else.** They appear in
 * this file and nowhere else in the interface. The timeline, which used to
 * colour its stages green-for-done, is now monochrome plus the one blue — so
 * when a colour does appear, it is the flag.
 *
 * **A rule is not a progress bar.** The segmented meter below reads as a
 * measurement with a resolution, which is honest about a signal derived from
 * four weighted inputs. A smooth bar implies a precision the number does not
 * have.
 */

const INK: Record<FlagColour, string> = {
  green: 'text-flag-green',
  amber: 'text-flag-amber',
  red: 'text-flag-red',
}

const RULE: Record<FlagColour, string> = {
  green: 'bg-flag-green',
  amber: 'bg-flag-amber',
  red: 'bg-flag-red',
}

/**
 * The flag, as a weighted rule over a mono label.
 *
 * The deck's `.toprule`: a 3px rule in the signal's colour, the label set in
 * mono capitals beneath it. It carries the same information as the pill did and
 * looks like it came from the pitch rather than from a component library.
 */
export function FlagRule({
  colour,
  label,
  width = 'full',
}: {
  colour: FlagColour
  label: string
  /** `short` for the inline summary on Today, `full` where the flag leads. */
  width?: 'short' | 'full'
}) {
  return (
    <div className={width === 'short' ? 'inline-block min-w-[96px]' : 'block'}>
      <div className={`h-[3px] w-full ${RULE[colour]}`} />
      <p
        className={`mt-2 font-mono text-[12px] font-medium uppercase tracking-[0.12em] ${INK[colour]}`}
      >
        {label}
      </p>
    </div>
  )
}

/**
 * One signal, as a ten-cell meter.
 *
 * Flat cells with a hairline gap, not a rounded bar: the gaps give the eye
 * something to count, so "seven of ten" is readable without the number beside
 * it. An unmeasured signal draws the empty track and says so in words — it is
 * not the same as a measured zero, and colouring it as one would teach the ward
 * to ignore the flag.
 */
export function SignalMeter({
  label,
  value,
  weight,
}: {
  label: string
  /** 0–1, or negative for "never recorded". */
  value: number
  /** Share of the summary, 0–1. */
  weight: number
}) {
  const measured = value >= 0
  const colour = gradeOf(value) ?? 'amber'
  const pct = measured ? Math.round(value * 100) : 0
  const cells = measured ? Math.round(value * 10) : 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{label}</span>
        <span
          className={`font-mono text-[12px] uppercase tracking-[0.08em] ${
            measured ? INK[colour] : 'text-ink-faint'
          }`}
        >
          {measured ? `${pct}%` : 'Not recorded'}
        </span>
      </div>

      <div
        className="mt-2 flex gap-[3px]"
        role="img"
        aria-label={measured ? `${label}: ${pct} percent` : `${label}: not recorded`}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={`h-[10px] flex-1 ${
              i < cells ? RULE[colour] : measured ? 'bg-paper-sunken' : 'bg-transparent'
            } ${measured ? '' : 'border border-hairline'}`}
          />
        ))}
      </div>

      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-faint">
        {Math.round(weight * 100)}% of the summary
      </p>
    </div>
  )
}
