'use client'

import { useState, useTransition } from 'react'

import { Icon } from '@/components/Icon'
import {
  BOWEL_SCALE,
  DIET_ANSWERS,
  FLUID_TARGET_GLASSES,
  type BowelScalePoint,
  type DietAnswer,
} from '@/domain/progress'

/**
 * The three signals the patient reports themselves.
 *
 * The fourth, prep timing, is measured rather than reported — it comes from the
 * doses actually logged on `/doses`. These three are self-report, and each is
 * asked in the smallest unit the patient can answer without arithmetic: glasses,
 * a colour, and one of three words.
 *
 * Each writes straight through to the flag the ward reads, which is the only
 * reason to ask at all. Nothing here is required: a signal left alone stays
 * "not recorded" rather than becoming a zero.
 */

function Panel({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentProps<typeof Icon>['name']
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-hairline pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2.5">
        <Icon name={icon} size={20} className="shrink-0 text-blue" />
        <h3 className="text-[19px] font-semibold tracking-[-0.018em] text-ink">{title}</h3>
      </div>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{hint}</p>
      <div className="mt-4">{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------------------

export function FluidInput({
  glasses,
  onRecord,
}: {
  glasses: number
  onRecord: (glasses: number) => Promise<number>
}) {
  const [value, setValue] = useState(glasses)
  const [, start] = useTransition()

  function change(delta: number) {
    const next = Math.max(0, Math.min(value + delta, 30))
    if (next === value) return
    setValue(next)
    start(async () => setValue(await onRecord(next)))
  }

  const met = value >= FLUID_TARGET_GLASSES

  return (
    <Panel
      icon="glass-water"
      title="Clear fluid today"
      hint={`Aim for ${FLUID_TARGET_GLASSES} glasses. Under-drinking is the most common reason a list gets cancelled, and it is dehydration rather than a dirty colon.`}
    >
      {/* One cell per target glass; anything past the target stacks on the counter. */}
      <div
        className="flex gap-[3px]"
        role="img"
        aria-label={`${value} glasses recorded, target ${FLUID_TARGET_GLASSES}`}
      >
        {Array.from({ length: FLUID_TARGET_GLASSES }, (_, i) => (
          <span
            key={i}
            className={`h-6 flex-1 ${i < value ? 'bg-blue' : 'border border-hairline bg-paper'}`}
          />
        ))}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-faint">
          {value} of {FLUID_TARGET_GLASSES} glasses
        </span>
        {met ? (
          <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-flag-green">
            Target met
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => change(1)}
          className="min-h-[52px] flex-1 bg-blue px-4 text-[17px] font-semibold text-white transition-colors hover:bg-blue-deep"
        >
          I drank a glass
        </button>
        <button
          type="button"
          onClick={() => change(-1)}
          disabled={value <= 0}
          className="min-h-[52px] border border-hairline-strong px-5 text-[17px] font-semibold text-ink transition-colors hover:bg-paper-sunken disabled:cursor-not-allowed disabled:text-ink-faint"
          aria-label="Undo one glass"
        >
          Undo
        </button>
      </div>
    </Panel>
  )
}

// ---------------------------------------------------------------------------

export function BowelInput({
  point,
  onRecord,
}: {
  point: BowelScalePoint | null
  onRecord: (point: BowelScalePoint | null) => Promise<BowelScalePoint | null>
}) {
  const [value, setValue] = useState(point)
  const [, start] = useTransition()

  function pick(next: BowelScalePoint) {
    const chosen = value === next ? null : next
    setValue(chosen)
    start(async () => setValue(await onRecord(chosen)))
  }

  const chosen = value ? BOWEL_SCALE[value] : null
  const points: BowelScalePoint[] = [1, 2, 3, 4, 5]

  return (
    <Panel
      icon="droplets"
      title="What you are passing"
      hint="Your department's own scale. Most are looking for 4 or 5 by the time you leave home — yours may differ."
    >
      <div className="flex gap-2" role="group" aria-label="Bowel clarity scale">
        {points.map((p) => {
          const active = value === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => pick(p)}
              aria-pressed={active}
              className={`flex-1 border-2 p-1.5 transition-colors ${
                active ? 'border-ink' : 'border-transparent hover:border-hairline-strong'
              }`}
            >
              <span
                className="block h-12 w-full border border-black/10"
                style={{ background: BOWEL_SCALE[p].swatch }}
              />
              <span
                className={`mt-1.5 block text-center font-mono text-[12px] tabular-nums ${
                  active ? 'text-ink' : 'text-ink-faint'
                }`}
              >
                {p}
              </span>
            </button>
          )
        })}
      </div>

      {chosen ? (
        <div className="mt-4">
          <p
            className={`font-mono text-[11px] uppercase tracking-[0.12em] ${
              chosen.clear ? 'text-flag-green' : 'text-flag-amber'
            }`}
          >
            Point {value} of 5 · {chosen.label}
          </p>
          <p className="mt-1.5 text-[16px] leading-relaxed text-ink">{chosen.meaning}</p>
        </div>
      ) : (
        <p className="mt-4 text-[15px] text-ink-faint">Tap the closest match. Tap again to clear.</p>
      )}

      {/* NEVER[1], stated where the reading is actually taken. */}
      <p className="mt-4 border-l-[3px] border-alert bg-alert-tint px-4 py-3 text-[15px] leading-relaxed text-alert">
        This raises a flag for your nurse. It does not decide whether your procedure goes ahead —
        the clinical team decides that.
      </p>
    </Panel>
  )
}

// ---------------------------------------------------------------------------

export function DietInput({
  offset,
  answer,
  onRecord,
}: {
  offset: number
  answer: DietAnswer | undefined
  onRecord: (offset: number, answer: DietAnswer) => Promise<DietAnswer>
}) {
  const [value, setValue] = useState(answer)
  const [, start] = useTransition()

  function pick(next: DietAnswer) {
    setValue(next)
    start(async () => setValue(await onRecord(offset, next)))
  }

  return (
    <Panel
      icon="utensils-crossed"
      title="How today's eating went"
      hint="Honest beats tidy. This is what tells your team how hard the week actually was, and nobody is marking you."
    >
      <div className="flex gap-2" role="group" aria-label="How the diet went today">
        {DIET_ANSWERS.map((a) => {
          const active = value === a.id
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => pick(a.id)}
              aria-pressed={active}
              className={`min-h-[52px] flex-1 px-2 text-[16px] font-semibold transition-colors ${
                active
                  ? 'bg-ink text-white'
                  : 'border border-hairline-strong bg-paper text-ink hover:bg-paper-sunken'
              }`}
            >
              {a.label}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
