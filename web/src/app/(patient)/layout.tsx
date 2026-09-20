import { redirect } from 'next/navigation'

import { TabBar } from '@/components/TabBar'
import { readSession } from '@/lib/session'

/**
 * The signed-in shell.
 *
 * The session check lives here rather than in middleware so that every page in
 * the group is guarded by the same call that also fetches the patient -- one
 * source of truth for "who is this", checked on the server on every request.
 */
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession()
  if (!session) redirect('/sign-in')

  return (
    <div className="min-h-dvh pb-[84px]">
      <main id="main" className="mx-auto w-full max-w-[560px] px-5 pb-8 pt-7">
        {children}
      </main>
      <TabBar />
    </div>
  )
}
