import { getI18n } from '@/lib/i18n-server'
import Link from 'next/link'

import { Card } from '@/components/ui'
import { NoPatient } from '@/components/NoPatient'
import { findPatient } from '@/lib/patients'
import { requireSession } from '@/lib/session'
import { foodTranslation } from '@/domain/diet-foods-i18n'
import { MealList } from './MealList'

export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Meal list — Colonaid') }
}

export default async function Diet() {
  const { tx, language } = await getI18n()

  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoPatient phone={session.phone} />

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{tx("Meal list")}</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">{tx("Choose your prep day and diet preference to see what you can eat.")}</p>
      </header>
      <MealList translation={await foodTranslation(language)} />

      <Card className="mt-6">
        <h3 className="text-[17px] font-semibold text-ink">{tx("Not on the list?")}</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">{tx("Ask in chat about a food you cannot find here.")}</p>
        <div className="mt-4">
          <Link
            href="/ask"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-blue px-4 text-[16px] font-semibold text-white hover:bg-blue-deep"
          >{tx("Ask in chat")}</Link>
        </div>
      </Card>
    </>
  )
}
