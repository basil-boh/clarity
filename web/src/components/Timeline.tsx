import { format, parseISO } from 'date-fns'

import { PHASE_COPY, PHASE_ORDER, type Phase } from '@/domain/prep'

/**
 * The five stages, as a ruled spine.
 *
 * What this replaces: five cards, each with a coloured circle — green tint for
 * done, blue for now, grey for later — and a blue wash behind the current one.
 * Three hues to say one thing, and the green collided with the flag, which is
 * the one place in this app green is allowed to mean something.
 *
 * So the timeline is monochrome. Progress is carried by **weight and rule**,
 * not hue: a past stage is a hairline tick and muted type, the current stage is
 * a solid blue block with its index reversed out, a future stage is an open
 * tick. The single blue is the only colour on the screen, which is exactly what
 * makes it read as "you are here" without a label — though the label is there
 * too, because a colour alone is not an accessible signal.
 *
 * The spine is a real 1px rule running the height of the list rather than a
 * border on each row, so it does not break at the gaps.
 */

/** When each stage begins, as an offset in days from the procedure. */
const PHASE_START: Record<Phase, number> = {
  waiting: -365,
  week_before: -7,
  diet_day: -3,
  purge_night: -1,
  procedure_day: 0,
  done: 1,
}

/**
 * How the stage is stamped on the spine.
 *
 * Mono, and in the patient's units rather than the plan's: "TONIGHT" and "THE
 * DAY" are what someone reading this at 11pm can map onto their own evening.
 * "D−3" would be correct and useless.
 */
const STAMP: Record<Phase, string> = {
  waiting: 'WAIT',
  week_before: 'WK −1',
  diet_day: 'DIET',
  purge_night: 'PURGE',
  procedure_day: 'SCOPE',
  done: 'DONE',
}

export function Timeline({ here, procedureDate }: { here: Phase; procedureDate: string }) {
  const procedure = parseISO(procedureDate)
  const hereIndex = PHASE_ORDER.indexOf(here)

  const dateOf = (phase: Phase) => {
    const d = new Date(procedure)
    d.setDate(d.getDate() + PHASE_START[phase])
    return d
  }

  return (
    <ol className="relative">
      {/* the spine: one continuous rule, behind every tick */}
      <span aria-hidden className="absolute bottom-3 left-[27px] top-3 w-px bg-hairline" />

      {PHASE_ORDER.map((phase, i) => {
        const isHere = phase === here
        const isPast = hereIndex > i

        return (
          <li key={phase} className="relative flex gap-4 pb-7 last:pb-0">
            <div className="relative z-10 w-[56px] shrink-0">
              <span
                className={`block py-1 text-center font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${
                  isHere
                    ? 'bg-blue text-white'
                    : isPast
                      ? 'bg-paper-sunken text-ink-faint'
                      : 'border border-hairline bg-paper text-ink-faint'
                }`}
              >
                {STAMP[phase]}
              </span>
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3
                  className={`text-[19px] font-semibold tracking-[-0.018em] ${
                    isPast ? 'text-ink-muted' : 'text-ink'
                  }`}
                >
                  {PHASE_COPY[phase].name}
                </h3>
                <span className="font-mono text-[11.5px] tabular-nums text-ink-faint">
                  {phase === 'waiting' ? 'UNTIL WK −1' : format(dateOf(phase), 'd MMM').toUpperCase()}
                </span>
              </div>

              <p
                className={`mt-1.5 text-[15.5px] leading-relaxed ${
                  isPast ? 'text-ink-faint' : 'text-ink-muted'
                }`}
              >
                {PHASE_COPY[phase].blurb}
              </p>

              {isHere ? (
                <p className="mt-2.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-blue">
                  <span aria-hidden className="h-[2px] w-5 bg-blue" />
                  You are here
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
