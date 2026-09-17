import Link from 'next/link'

import { Card } from '@/components/ui'
import { Wordmark } from '@/components/brand'
import { formatPhone } from '@/lib/phone'

/**
 * Signed in, but no booking against this number.
 *
 * Reached by anyone who proves they hold a phone the department has no record
 * of -- a mistyped digit, a new number, a patient whose booking is under a
 * relative's mobile. It says what to do next and does not imply anything about
 * whether a procedure exists.
 */
export function NoRecord({ phone }: { phone: string }) {
  return (
    <>
      <header className="mb-7">
        <Wordmark width={116} />
        <h1 className="mt-4 text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-ink">
          Nothing booked under this number
        </h1>
      </header>

      <Card>
        <p className="text-[17px] leading-relaxed text-ink-muted">
          We have no colonoscopy against {formatPhone(phone)}. That usually means the department
          holds a different number for you — often a family member&rsquo;s.
        </p>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
          Call your endoscopy department to check which number they have, then sign in with that
          one.
        </p>
        <Link
          href="/sign-out"
          className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
        >
          Try a different number
        </Link>
      </Card>
    </>
  )
}
