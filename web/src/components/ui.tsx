import type { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

/**
 * The interface kit.
 *
 * Plain, high-contrast, generously spaced -- closer to a government service
 * page than to a consumer health app. Card edges are hairlines rather than
 * shadows, and nothing is coloured unless the colour carries meaning.
 */

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={twMerge('rounded-xl border border-hairline bg-paper p-5', className)}
    >
      {children}
    </section>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.11em] text-ink-faint">
      {children}
    </h2>
  )
}

export function Divider() {
  return <hr className="my-0 border-0 border-t border-hairline" />
}

export function Button({
  children,
  variant = 'primary',
  ...rest
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg px-5 text-[17px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45'
  const look =
    variant === 'primary'
      ? 'bg-blue text-white hover:bg-blue-deep'
      : 'border border-hairline-strong bg-paper text-ink hover:bg-paper-sunken'
  return (
    <button className={twMerge(base, look)} {...rest}>
      {children}
    </button>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-semibold text-ink">{label}</span>
      {hint ? <span className="mb-2 block text-[15px] text-ink-muted">{hint}</span> : null}
      {children}
      {error ? (
        <span role="alert" className="mt-2 block text-[15px] font-medium text-flag-red">
          {error}
        </span>
      ) : null}
    </label>
  )
}

const INPUT =
  'w-full rounded-lg border border-hairline-strong bg-paper px-4 py-3.5 text-[19px] text-ink ' +
  'placeholder:text-ink-faint focus:border-blue focus:outline-none'

export function Input(props: React.ComponentPropsWithRef<'input'>) {
  const { className = '', ...rest } = props
  return <input className={twMerge(INPUT, className)} {...rest} />
}

/**
 * A labelled statistic. Used for the appointment date and the countdown, which
 * are the two things a patient opens the app to check.
 */
export function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.11em] text-ink-faint">
        {label}
      </div>
      <div className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[15px] text-ink-muted">{sub}</div> : null}
    </div>
  )
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'alert'
  children: ReactNode
}) {
  const look =
    tone === 'alert'
      ? 'bg-alert-tint text-alert border-alert/25'
      : 'bg-blue-wash text-blue-deep border-blue/20'
  return (
    <div className={`rounded-lg border px-4 py-3 text-[15px] leading-relaxed ${look}`}>
      {children}
    </div>
  )
}
