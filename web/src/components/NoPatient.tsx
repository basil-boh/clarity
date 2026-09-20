import { redirect } from 'next/navigation'

import { usingDatabase } from '@/lib/source'

import { NoRecord } from './NoRecord'

/**
 * Signed in, with nothing on file.
 *
 * This used to mean one thing -- the department has no booking against this
 * number -- because only the department could create a record. Now that
 * patients enter their own details it usually means something much more
 * ordinary: they have not filled the form in yet. So they are sent to it.
 *
 * The old reading still applies when there is nowhere to write: on the demo
 * fixture a number that is not one of the three cannot be registered, and
 * sending someone to a form that cannot save would be a loop.
 */
export async function NoPatient({ phone }: { phone: string }) {
  if (usingDatabase()) redirect('/welcome')
  return <NoRecord phone={phone} />
}
