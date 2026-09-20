import Link from 'next/link'

import { Card } from '@/components/ui'
import { NoRecord } from '@/components/NoRecord'
import { findPatient } from '@/lib/patients'
import { requireSession } from '@/lib/session'
import { MealList } from './MealList'

export const metadata = { title: 'Meal list — Clarity' }

export default async function Diet() {
  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoRecord phone={session.phone} />

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">Meal list</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
          Choose your prep day and diet preference to see what you can eat.
        </p>
      </header>
      <MealList />

      <Card className="mt-6">
        <h3 className="text-[17px] font-semibold text-ink">Not on the list?</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
          Guidance differs between hospitals, so when it matters your hospital&rsquo;s answer is
          the one that applies to you.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <a
            href={`tel:${patient.procedure.departmentPhone}`}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink hover:bg-paper-sunken"
          >
            Call the hospital
          </a>
          <Link
            href="/ask"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-blue px-4 text-[16px] font-semibold text-white hover:bg-blue-deep"
          >
            Ask in chat
          </Link>
        </div>
      </Card>
    </>
  )
}
