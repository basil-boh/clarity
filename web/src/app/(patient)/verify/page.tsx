import { Card } from '@/components/ui'
import { NoPatient } from '@/components/NoPatient'
import { StoolPhotoCheck } from '@/components/StoolPhotoCheck'
import { offsetFor } from '@/domain/prep'
import type { BowelScalePoint } from '@/domain/progress'
import { livePatient } from '@/lib/patients'
import { prepTimingFrom, readProgress, recordStool } from '@/lib/progress'
import { requireSession } from '@/lib/session'
import { acceptVerification } from '@/lib/verification-store'

export const metadata = { title: 'Verify — Clarity' }

/**
 * One question, on the morning of the procedure: does this look clear yet?
 *
 * The page does nothing else on purpose. It used to carry the whole tracker --
 * fluids, diet days, the step count, the four signals -- and all of that is now
 * gone from here. Someone opening this at 6am, an hour before they leave for
 * the hospital, is answering one question, and a page that also asks them to
 * log yesterday's glasses of water is a page they have to read past.
 *
 * What it records is unchanged: a point on the department's 1-5 scale, written
 * through the same `recordStool` the tracker used, so the ward's summary and
 * the flag in /admin still move exactly as they did.
 */
export default async function Verify() {
  const session = await requireSession()
  const progress = await readProgress()
  const patient = await livePatient(session.phone, progress, prepTimingFrom(progress.doses))
  if (!patient) return <NoPatient phone={session.phone} />

  const offset = offsetFor(patient.procedure.date)
  // The purge night counts too. The doses are at 18:00 and 2am and people do
  // check between them; telling someone at 3am that this is a morning page
  // would be pedantry at the exact moment they are most worried.
  const inWindow = offset === 0 || offset === -1

  async function acceptReading(id: string, point: BowelScalePoint): Promise<void> {
    'use server'
    const { phone } = await requireSession()
    await recordStool(point)
    await acceptVerification(phone, id, point)
  }

  return (
    <>
      <header className="mb-7">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          {offset === 0 ? 'Check before you go' : 'Check your preparation'}
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
          Photograph the bowl and we will read it against your hospital&rsquo;s scale. Your team
          sees the result.
        </p>
      </header>

      {!inWindow ? (
        <Card className="mb-5">
          <p className="text-[16px] leading-relaxed text-ink-muted">
            This is for the night of your preparation and the morning of your procedure. You can
            use it now, but there will be nothing to see until the preparation has started working.
          </p>
        </Card>
      ) : null}

      <StoolPhotoCheck onAccept={acceptReading} />
    </>
  )
}
