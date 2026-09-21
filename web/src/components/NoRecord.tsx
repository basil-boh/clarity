'use client'

import { useI18n } from '@/components/I18nProvider'
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
  const { tx } = useI18n()

  return (
    <>
      <header className="mb-7">
        <Wordmark width={116} />
        <h1 className="mt-4 text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-ink">{tx("Nothing booked under this number")}</h1>
      </header>

      <Card>
        <p className="text-[17px] leading-relaxed text-ink-muted">{tx("We have no colonoscopy against")}{' '}{tx(formatPhone(phone))}{tx(". That usually means the hospital/clinic holds a different number for you — often a family member’s.")}</p>
        <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">{tx("Call your endoscopy hospital/clinic to check which number they have, then sign in with that one.")}</p>
        <Link
          href="/sign-out"
          className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
        >{tx("Try a different number")}</Link>
      </Card>
    </>
  )
}
