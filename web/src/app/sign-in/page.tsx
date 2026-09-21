import { getI18n } from '@/lib/i18n-server'
import { redirect } from 'next/navigation'

import { Wordmark } from '@/components/brand'
import { demoPhoneList, isDemoMode, resendSeconds } from '@/lib/otp'
import { demoNumbers } from '@/lib/patients'
import { readSession } from '@/lib/session'

import { SignInForm } from './SignInForm'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Sign in — Clarity') }
}

export default async function SignIn() {
  const { tx } = await getI18n()

  if (await readSession()) redirect('/today')

  // Three states, and the copy has to be honest about which one it is in.
  // "Demo mode" printed over a build that texts every other number for real
  // would be a lie that costs someone an SMS bill.
  const bypass = demoPhoneList()
  const demo = bypass.length > 0 ? 'some' : isDemoMode() ? 'all' : 'off'
  const numbers = bypass.length > 0 ? bypass : isDemoMode() ? demoNumbers().map((n) => n.phone) : []

  return (
    <div className="min-h-dvh">
      <main id="main" className="mx-auto w-full max-w-[520px] px-5 pb-16 pt-9">
      <header className="mb-9">
        <Wordmark width={148} />
        <h1 className="mt-6 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{tx("Your colonoscopy preparation")}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">{tx("Sign in with the mobile number your endoscopy hospital/clinic has on file.")}</p>
      </header>

      <SignInForm demo={demo} demoNumbers={numbers} resendSeconds={resendSeconds()} />

      <footer className="mt-12 border-t border-hairline pt-5 text-[15px] leading-relaxed text-ink-faint">{tx("This app supports your preparation. It does not replace your care team. In an emergency, call 995.")}</footer>
      </main>
    </div>
  )
}
