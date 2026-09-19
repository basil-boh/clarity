'use client'

import { useState } from 'react'

import { exportPlanCalendar } from '@/domain/calendar-export'
import type { PlanDay, Procedure } from '@/domain/prep'
import type { MedicationOccurrence } from '@/domain/medications'

import { Icon } from './Icon'

export function CalendarExportButton({
  procedure,
  plan,
  medications = [],
}: {
  procedure: Procedure
  plan: readonly PlanDay[]
  medications?: readonly MedicationOccurrence[]
}) {
  const [downloaded, setDownloaded] = useState(false)

  function downloadCalendar() {
    const calendar = exportPlanCalendar({ procedure, plan, medications })
    const blob = new Blob([calendar.content], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = calendar.filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Let the browser begin the download before releasing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setDownloaded(true)
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={downloadCalendar}
        className="group flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-[#4285f4]/35 bg-[#4285f4]/14 px-4 text-left text-[#245fbd] transition-colors hover:bg-[#4285f4]/22 active:bg-[#4285f4]/28"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#4285f4]/18 text-[#4285f4] transition-transform group-hover:-translate-y-0.5">
          <Icon name="calendar-check" size={22} />
        </span>
        <span className="min-w-0">
          <span className="block text-[17px] font-semibold leading-tight">Download calendar file</span>
          <span className="mt-0.5 block text-[14px] leading-snug text-[#245fbd]/80">
            Click here to add your preparation reminders to a calendar app
          </span>
        </span>
      </button>
      {downloaded ? (
        <p role="status" className="mt-3 border-l-2 border-blue pl-3 text-[15px] leading-relaxed text-ink">
          Your calendar file is ready. A new download does not update previously imported events.
          If your instructions or procedure date changed, delete earlier Clarity events before importing this new plan.
        </p>
      ) : null}
    </div>
  )
}
