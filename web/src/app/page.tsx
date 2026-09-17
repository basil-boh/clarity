import { redirect } from 'next/navigation'

import { readSession } from '@/lib/session'

/**
 * Where the QR code lands.
 *
 * The patient scanned a square on a letter in a clinic. They get one decision
 * here and it is made for them: signed in already, go to the plan; otherwise,
 * sign in. No marketing page in between.
 */
export default async function Entry() {
  const session = await readSession()
  redirect(session ? '/today' : '/sign-in')
}
