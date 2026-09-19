import Link from 'next/link'

import { Wordmark } from '@/components/brand'
import { Card } from '@/components/ui'

import { signOut } from './actions'

export const ALL_PATIENTS = { href: '/admin', label: 'All patients' }

export function AdminHeader({
  title,
  back,
}: {
  title: string
  back?: { href: string; label: string }
}) {
  return (
    <header className="mb-7">
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin" aria-label="All patients" className="flex items-center gap-3">
          <Wordmark width={108} />
          <span className="rounded-full bg-paper-sunken px-2.5 py-0.5 text-[13px] font-semibold text-ink-muted">
            Admin
          </span>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-[44px] text-[15px] font-semibold text-ink-muted underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </form>
      </div>
      {back ? (
        <Link
          href={back.href}
          className="mt-6 inline-block text-[15px] font-semibold text-blue underline-offset-4 hover:underline"
        >
          ← {back.label}
        </Link>
      ) : null}
      <h1 className="mt-3 text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-ink">
        {title}
      </h1>
    </header>
  )
}

/** The demo cohort is code, not rows, so there is nothing here to edit. */
export function NoDatabase() {
  return (
    <Card>
      <p className="text-[17px] leading-relaxed text-ink-muted">
        This build is running on the demo patients, which are written into{' '}
        <code className="font-mono text-[15px]">src/lib/patients.ts</code> rather than stored
        anywhere this page can change.
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
        Set <code className="font-mono text-[15px]">SUPABASE_URL</code> and{' '}
        <code className="font-mono text-[15px]">SUPABASE_SERVICE_ROLE_KEY</code> in{' '}
        <code className="font-mono text-[15px]">.env.local</code> to manage patients from here.
      </p>
    </Card>
  )
}
