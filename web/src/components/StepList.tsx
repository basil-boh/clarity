'use client'

import { useI18n } from '@/components/I18nProvider'

import { useState } from 'react'

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

/**
 * Ticking a step off.
 *
 * Only the steps in `tickable` get a box -- today's and earlier, so nothing can
 * be marked done before its day. The tick shows at once and is put
 * back if the save fails: on the purge night a box that silently did not save
 * is worse than one that says so. One save at a time, because each is a
 * read-then-write of the whole record and two in flight could undo each other.
 */
export function StepList({
  steps,
  completed = [],
  tickable = [],
  onToggle,
}: {
  steps: readonly Step[]
  completed?: readonly string[]
  /** Step uids that can be ticked off here. */
  tickable?: readonly string[]
  /** Saves the tick and returns the patient's whole completed list. */
  onToggle?: (uid: string) => Promise<readonly string[]>
}) {
  const { tx } = useI18n()

  const [ticked, setTicked] = useState<ReadonlySet<string>>(() => new Set(completed))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(uid: string) {
    if (!onToggle || saving) return
    const before = ticked
    const next = new Set(ticked)
    if (next.has(uid)) next.delete(uid)
    else next.add(uid)
    setTicked(next)
    setSaving(true)
    setError(null)
    try {
      setTicked(new Set(await onToggle(uid)))
    } catch {
      setTicked(before)
      setError('That did not save. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <ol className="divide-y divide-hairline">
        {steps.map((step) => {
          const done = ticked.has(step.uid)
          const canTick = Boolean(onToggle) && tickable.includes(step.uid)
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
                    {tx(step.at)}
                  </span>
                ) : (
                  <span className="block py-1 font-mono text-[13px] tabular-nums text-ink-muted">
                    {tx(step.at ?? '—')}
                  </span>
                )}
                {/* "02:00" under a heading that says tonight is ambiguous at a
                    glance -- and this is the dose most often missed. Say which
                    side of midnight it falls on. */}
                {step.nextDay ? (
                  <span className="mt-1 block text-center font-mono text-[10.5px] uppercase tracking-[0.08em] text-flag-amber">{tx("after midnight")}</span>
                ) : null}
                <span className="mt-1.5 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-faint">
                  <Icon name={KIND_ICON[step.kind]} size={13} className="shrink-0" />
                  {tx(KIND_LABEL[step.kind])}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`text-[17px] font-semibold leading-snug tracking-[-0.012em] ${
                    done ? 'text-ink-faint line-through decoration-hairline-strong' : 'text-ink'
                  }`}
                >
                  {tx(step.title)}
                </p>
                {step.detail ? (
                  <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-muted">{tx(step.detail)}</p>
                ) : null}
                {done ? (
                  <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">{tx("Done")}</p>
                ) : null}
              </div>

              {canTick ? (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={tx(step.title)}
                  disabled={saving}
                  onClick={() => toggle(step.uid)}
                  className="-mr-1.5 -mt-1.5 flex h-11 w-11 shrink-0 items-center justify-center disabled:cursor-wait"
                >
                  <span
                    aria-hidden
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                      done
                        ? 'border-blue bg-blue text-white'
                        : 'border-hairline-strong bg-paper text-transparent'
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                </button>
              ) : null}
            </li>
          )
        })}
      </ol>
      {error ? (
        <p role="alert" className="mt-3 text-[15px] font-medium text-alert">
          {tx(error)}
        </p>
      ) : null}
    </>
  )
}
