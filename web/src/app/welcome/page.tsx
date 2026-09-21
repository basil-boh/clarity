import { getI18n } from '@/lib/i18n-server'
import { Wordmark } from '@/components/brand'
import { DEFAULT_LANGUAGE } from '@/domain/i18n'
import { findPatient } from '@/lib/patients'
import { readLanguagePreference } from '@/lib/language'
import { requireSession } from '@/lib/session'

import { saveDetails } from './actions'
import { WelcomeForm, WelcomeIntro } from './WelcomeForm'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Before you start — Colonaid') }
}

/**
 * Where a patient tells the app who they are.
 *
 * This app has no hospital system behind it, so nothing is known about anyone
 * until they say it here: the name, the date the whole plan is derived from,
 * and the language to say it all in. A patient who has already been here gets
 * the same form with their answers in it -- a rescheduled procedure is the
 * normal reason to come back, and it is the one change that moves every date in
 * the app.
 */
export default async function Welcome() {
  const session = await requireSession()
  const [patient, chosen] = await Promise.all([
    findPatient(session.phone),
    readLanguagePreference(),
  ])

  const editing = Boolean(patient)
  // The cookie is what the surrounding screen is already rendered in, so it
  // wins. With no cookie -- a new phone, cleared browser -- the language saved
  // against the patient is the better guess than defaulting to English.
  const language = chosen ?? patient?.profile.language ?? DEFAULT_LANGUAGE

  return (
    <div className="min-h-dvh">
      <main id="main" className="mx-auto w-full max-w-[560px] px-5 pb-16 pt-8">
        <header className="mb-7">
          <Wordmark width={116} />
          <WelcomeIntro editing={editing} />
        </header>

        <WelcomeForm
          action={saveDetails}
          language={language}
          name={patient?.profile.displayName ?? ''}
          date={patient?.procedure.date ?? ''}
          editing={editing}
        />
      </main>
    </div>
  )
}
