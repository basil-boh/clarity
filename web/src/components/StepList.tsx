import { Icon, type IconName } from '@/components/Icon'
import type { Step } from '@/domain/prep'

/**
 * A day's steps.
 *
 * The emphasis on a critical step used to be a coloured bar down the left edge
 * — the house style of every notification component ever shipped. It now sits
 * in the time gutter instead, as a solid block with the time reversed out of
 * it, which is how the deck draws "DIET · 3 DAYS" and "PURGATIVE · 8 HRS". The
 * block is the thing the eye lands on, it is where the information already was,
 * and it costs no horizontal space on a 390px screen.
 *
 * Colour follows the deck's split rather than a severity scale: **amber is the
 * diet, blue is the purgative.** Those are the two halves of the argument —
 * diet decides the experience, the purgative decides the outcome — so the two
 * critical kinds are told apart by hue rather than both shouting in red. The
 * flag's green/amber/red is not used here at all; it means prep readiness and
 * lives only in `signal.tsx`.
 */

const KIND_LABEL: Record<Step['kind'], string> = {
  diet: 'Diet',
  fluid: 'Fluids',
  medicine: 'Meds',
  purgative: 'Prep',
  admin: 'Admin',
}

/** A glyph per kind, so the eye sorts the list before it reads it. */
const KIND_ICON: Record<Step['kind'], IconName> = {
  diet: 'utensils-crossed',
  fluid: 'glass-water',
  medicine: 'milk',
  purgative: 'droplets',
  admin: 'calendar-check',
}

/** Solid blocks, for the steps where the time is the point. */
const BLOCK: Partial<Record<Step['kind'], string>> = {
  purgative: 'bg-blue text-white',
  diet: 'bg-flag-amber text-white',
  fluid: 'bg-ink text-white',
}

export function StepList({
  steps,
  completed = [],
}: {
  steps: readonly Step[]
  completed?: readonly string[]
}) {
  return (
    <ol className="divide-y divide-hairline">
      {steps.map((step) => {
        const done = completed.includes(step.uid)
        const solid = step.weight === 'critical' && step.at

        return (
          <li key={step.uid} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div className="w-[60px] shrink-0">
              {solid ? (
                <span
                  className={`block px-1.5 py-1 text-center font-mono text-[13px] font-medium tabular-nums ${
                    BLOCK[step.kind] ?? 'bg-ink text-white'
                  }`}
                >
                  {step.at}
                </span>
              ) : (
                <span className="block py-1 font-mono text-[13px] tabular-nums text-ink-muted">
                  {step.at ?? '—'}
                </span>
              )}
              <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                <Icon name={KIND_ICON[step.kind]} size={13} className="shrink-0" />
                {KIND_LABEL[step.kind]}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-[17px] font-semibold leading-snug tracking-[-0.012em] ${
                  done ? 'text-ink-faint line-through decoration-hairline-strong' : 'text-ink'
                }`}
              >
                {step.title}
              </p>
              {step.detail ? (
                <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{step.detail}</p>
              ) : null}
              {done ? (
                <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                  Done
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
