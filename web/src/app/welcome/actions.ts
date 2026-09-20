'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { parseRegistration, type DateError, type NameError } from '@/domain/registration'
import { writeLanguage } from '@/lib/language'
import { saveRegistration } from '@/lib/registration-store'
import { requireSession } from '@/lib/session'

/**
 * What comes back to the form when it cannot move on.
 *
 * Errors are message *keys*, not sentences: the form renders them in whichever
 * language the patient has selected, which may not be the one the action ran
 * in.
 */
export type RegistrationState = {
  readonly errors?: { name?: NameError; date?: DateError }
  readonly failed?: boolean
}

export async function saveDetails(
  _state: RegistrationState,
  form: FormData,
): Promise<RegistrationState> {
  const session = await requireSession()

  const parsed = parseRegistration({
    name: form.get('name'),
    date: form.get('date'),
    language: form.get('language'),
  })

  if (!parsed.ok) return { errors: parsed.errors }

  // The language is honoured even when the save fails. It costs nothing, and a
  // patient who has just switched to Tamil should not be told to try again in
  // English.
  await writeLanguage(parsed.value.language)

  const outcome = await saveRegistration(session.phone, parsed.value)
  if (outcome === 'failed') return { failed: true }

  // Every screen is derived from the procedure date, so all of them are stale
  // the moment it changes.
  revalidatePath('/', 'layout')
  redirect('/today')
}
