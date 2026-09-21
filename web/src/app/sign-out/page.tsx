import { getI18n } from '@/lib/i18n-server'
import { redirect } from 'next/navigation'

import { Button } from '@/components/ui'
import { clearSession } from '@/lib/session'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Sign out — Colonaid') }
}

/**
 * Signing out is a POST, not a link.
 *
 * A GET that destroys a session can be fired by any prefetch or image tag, so
 * the link on the Today page lands here and the actual clearing happens in a
 * server action behind a form.
 */
export default async function SignOut() {
  const { tx } = await getI18n()

  async function out() {
    'use server'
    await clearSession()
    redirect('/sign-in')
  }

  return (
    <main id="main" className="mx-auto min-h-dvh w-full max-w-[520px] px-5 pt-16">
      <h1 className="text-[28px] font-bold leading-[1.12] tracking-[-0.03em] text-ink">{tx("Sign out of Colonaid?")}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">{tx("You will need your mobile number and a new code to get back in.")}</p>
      <form action={out} className="mt-7 space-y-3">
        <Button type="submit">{tx("Sign out")}</Button>
      </form>
      <a
        href="/today"
        className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center rounded-lg border border-hairline-strong px-5 text-[17px] font-semibold text-ink"
      >{tx("Stay signed in")}</a>
    </main>
  )
}
