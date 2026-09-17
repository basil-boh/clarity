import { redirect } from 'next/navigation'

import { InstitutionBar, Wordmark } from '@/components/brand'
import { isDemoMode, resendSeconds } from '@/lib/otp'
import { readSession } from '@/lib/session'

import { SignInForm } from './SignInForm'

export const metadata = { title: 'Sign in — Clarity' }

export default async function SignIn() {
  if (await readSession()) redirect('/today')

  return (
    <div className="min-h-dvh">
      <InstitutionBar />
      <main id="main" className="mx-auto w-full max-w-[520px] px-5 pb-16 pt-9">
      <header className="mb-9">
        <Wordmark width={148} />
        <h1 className="mt-6 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          Your colonoscopy preparation
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">
          Sign in with the mobile number your endoscopy department has on file.
        </p>
      </header>

      <SignInForm demo={isDemoMode()} resendSeconds={resendSeconds()} />

      <footer className="mt-12 border-t border-hairline pt-5 text-[15px] leading-relaxed text-ink-faint">
        This app supports your preparation. It does not replace your care team. In an emergency,
        call 995.
      </footer>
      </main>
    </div>
  )
}
