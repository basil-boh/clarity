'use client'

import { useI18n } from '@/components/I18nProvider'

import { useEffect, useRef, useState } from 'react'
import { hasDepartmentPhone, type Procedure } from '@/domain/prep'
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGES, medicationIssues, parseMedicationExtraction, resolveMedicationDate, type MedicationDraft, type ReviewedMedication } from '@/domain/medications'
import { Button, Field, Input, Notice } from './ui'
import { Icon } from './Icon'

type Photo = { file: File; url: string }
const inputStyle = 'w-full rounded-lg border border-hairline-strong bg-paper px-3 py-3 text-[16px] text-ink'

function initialTimes(d: MedicationDraft): string[] {
  return d.action === 'hold' ? [''] : Array.from({ length: d.frequency ?? Math.max(1, d.times.length) }, (_, i) => d.times[i] ?? '')
}

export function MedicationReview({ procedure, entries, onChange, persisted = false }: {
  procedure: Procedure
  entries: ReviewedMedication[]
  onChange: (entries: ReviewedMedication[]) => void
  /** Whether confirmed entries are being kept against the patient's record. */
  persisted?: boolean
}) {
  const { tx } = useI18n()

  const [open, setOpen] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)
  const resources = useRef<Photo[]>([])
  const request = useRef<AbortController | null>(null)
  const reviewHeading = useRef<HTMLHeadingElement>(null)

  useEffect(() => () => {
    request.current?.abort()
    resources.current.forEach(photo => URL.revokeObjectURL(photo.url))
  }, [])

  function changePhotos(next: Photo[]) {
    request.current?.abort()
    request.current = null
    setBusy(false)
    resources.current.filter(photo => !next.includes(photo)).forEach(photo => URL.revokeObjectURL(photo.url))
    resources.current = next
    setPhotos(next)
    // Entries already added to the plan are the patient's, not the photos'.
    onChange(entries.filter(entry => entry.confirmed))
    setError('')
    setMessage('')
  }

  function addPhotos(files: FileList | null) {
    if (!files?.length) return
    const incoming = Array.from(files)
    if (photos.length + incoming.length > MAX_IMAGES) { setError('Choose up to three photos. Remove a photo before adding another.'); return }
    if (incoming.some(file => !IMAGE_TYPES.includes(file.type) || !file.size || file.size > MAX_IMAGE_BYTES)) {
      setError('Use JPEG, PNG or WebP photos, up to 5 MB each. For HEIC or other formats, retake the photo using the camera.'); return
    }
    changePhotos([...photos, ...incoming.map(file => ({ file, url: URL.createObjectURL(file) }))])
  }

  async function readPhotos() {
    const controller = new AbortController()
    request.current?.abort()
    request.current = controller
    setBusy(true)
    setError('')
    setMessage('')
    const form = new FormData()
    photos.forEach(photo => form.append('images', photo.file))
    try {
      const response = await fetch('/api/medications/extract', { method: 'POST', body: form, signal: controller.signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Photo reading failed. Please try again.')
      if (data.procedureDate !== procedure.date) throw new Error('Your procedure date changed. Refresh the page and review the instructions again.')
      const drafts = parseMedicationExtraction(data, photos.length)
      if (!drafts.length) throw new Error('No medication instructions were readable. Try a clearer photo of the hospital/clinic’s instructions.')
      if (controller.signal.aborted) return
      onChange([...entries.filter(entry => entry.confirmed), ...drafts.map(draft => ({ id: crypto.randomUUID(), draft: { ...draft, frequency: draft.action === 'take' ? initialTimes(draft).length : null }, reminderTimes: initialTimes(draft), doseAmounts: initialTimes(draft).map(() => draft.amount || draft.quantity || ''), confirmed: false, procedureDate: procedure.date }))])
      setMessage('Instructions read. Check each entry against your sheet before adding it.')
      requestAnimationFrame(() => reviewHeading.current?.focus())
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Photo reading failed. Please try again.')
    } finally {
      if (request.current === controller) { setBusy(false); request.current = null }
    }
  }

  function update(entry: ReviewedMedication) {
    onChange(entries.map(current => current.id === entry.id ? entry : current))
    setMessage('Changes need confirmation before they appear in your plan.')
  }

  const added = entries.filter(entry => entry.confirmed).length

  return (
    <section className="mt-5 border-y border-hairline py-5" aria-label={tx("Medication instructions")}>
      <button type="button" aria-expanded={open} aria-controls="medication-upload" onClick={() => setOpen(!open)}
        className="flex min-h-[52px] w-full items-center gap-3 text-left text-blue-deep">
        <Icon name="camera" size={24} className="shrink-0" />
        <span className="flex-1"><span className="block text-[17px] font-semibold">{tx(open ? 'Your medication instructions' : 'Add medication instructions')}</span>
          <span className="mt-1 block text-[14px] text-ink-muted">{tx(added > 0 ? `${added} added to your plan` : 'Optional · from your hospital/clinic’s preparation sheet')}</span></span>
        <span className="text-[24px]" aria-hidden="true">{tx(open ? '−' : '+')}</span>
      </button>

      {open && <div id="medication-upload" className="mt-4 space-y-5">
        <p className="text-[15px] leading-relaxed text-ink-muted">{tx("Photograph the instructions that say which medicines to take or hold before your colonoscopy. A usual prescription list alone is not enough.")}</p>
        <Notice>{tx(persisted
          ? 'Photos are sent to OpenAI for automated reading and are not stored by Clarity. Check the result against your sheet. Instructions you add to your plan are saved to your record, so they are still here next time, and your hospital/clinic can see them.'
          : 'Photos are sent to OpenAI for automated reading. Check the result against your sheet. Photos and reviewed instructions are not saved by Clarity; leaving or refreshing this page clears them.')}</Notice>
        <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" aria-label={tx("Take medication photo")}
          onChange={event => { addPhotos(event.target.files); event.target.value = '' }} />
        <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label={tx("Choose medication photos")}
          onChange={event => { addPhotos(event.target.files); event.target.value = '' }} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => camera.current?.click()}><Icon name="camera" size={19} />{tx("Take a photo")}</Button>
          <Button variant="secondary" onClick={() => gallery.current?.click()}>{tx("Choose from gallery")}</Button>
        </div>
        <p className="text-[13px] text-ink-muted">{tx("Up to 3 photos · JPEG, PNG or WebP · 5 MB each. Changing photos clears entries you have not added yet.")}</p>
        {photos.length > 0 && <ol className="grid grid-cols-3 gap-3">
          {photos.map((photo, i) => <li key={photo.url} className="min-w-0">
            <a href={photo.url} target="_blank" rel="noreferrer" aria-label={tx(`Enlarge photo ${i + 1}`)}>
              {/* Object URLs are short-lived local previews, not remote Next images. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={tx(`Instruction sheet, photo ${i + 1}`)} className="aspect-[3/4] w-full rounded border border-hairline object-contain bg-paper-sunken" />
            </a>
            <button type="button" className="min-h-[44px] text-[13px] text-blue-deep underline" onClick={() => changePhotos(photos.filter(p => p !== photo))}>{tx("Remove photo")}{' '}{tx(i + 1)}</button>
          </li>)}
        </ol>}
        <Button disabled={!photos.length || busy} onClick={readPhotos}>{tx(busy ? 'Reading your instructions…' : entries.some(entry => !entry.confirmed) ? 'Read photos again' : 'Read these photos')}</Button>
        {busy && <button type="button" className="min-h-[44px] text-blue-deep underline" onClick={() => { request.current?.abort(); request.current = null; setBusy(false) }}>{tx("Cancel reading")}</button>}
        {error && <div role="alert"><Notice tone="alert">{tx(error)}</Notice></div>}
        <p role="status" className="text-[15px] text-ink-muted">{tx(message)}</p>

        {entries.length > 0 && <div className="space-y-5">
          <h2 ref={reviewHeading} tabIndex={-1} className="text-[22px] font-semibold tracking-tight">{tx("Check against your sheet")}</h2>
          <p className="text-[15px] text-ink-muted">{tx("Correct transcription errors using the written instructions. If a dose or date is missing, ask your hospital/clinic. The app cannot decide it.")}</p>
          {entries.map((entry, index) => {
            const d = entry.draft
            const issues = medicationIssues(entry, procedure.date)
            const setDraft = (patch: Partial<MedicationDraft>, resetTimes = false) => {
              const draft = { ...d, ...patch }
              if (resetTimes) draft.frequency = draft.action === 'take' ? initialTimes(draft).length : null
              update({ ...entry, draft, confirmed: false, reminderTimes: resetTimes ? initialTimes(draft) : entry.reminderTimes, doseAmounts: resetTimes ? initialTimes(draft).map(() => draft.amount || draft.quantity || '') : entry.doseAmounts })
            }
            return <article key={entry.id} className="rounded-xl border border-hairline bg-paper p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-[18px] font-semibold">{tx(index + 1)}. {d.name || tx('Unreadable medicine')}</h3>
                <button type="button" className="min-h-[44px] shrink-0 text-[14px] text-blue-deep underline" aria-label={tx(`Remove ${d.name || 'entry'}`)} onClick={() => { onChange(entries.filter(e => e.id !== entry.id)); setMessage('Entry removed from the plan.') }}>{tx("Remove")}</button>
              </div>
              <blockquote className="mb-4 border-l-2 border-hairline-strong pl-3 text-[15px] leading-relaxed text-ink-muted">
                “{d.sourceText || tx('No readable source text')}”
                {photos.length > 0 && <span className="mt-1 block text-[12px]">{tx("Photo")}{' '}{tx(d.sources.join(', '))}</span>}
              </blockquote>
              {entry.confirmed && !issues.length ? <div>
                <p className="text-[15px] text-blue-deep">{tx("Added to your plan ·")}{' '}{tx(d.action === 'hold' ? 'hold reminders' : 'doses')}{' '}{tx("at")}{' '}{tx(entry.reminderTimes.join(', '))}</p>
                <button type="button" className="mt-2 min-h-[44px] text-blue-deep underline" onClick={() => update({ ...entry, confirmed: false })}>{tx("Edit instructions")}</button>
              </div> : <div className="space-y-4">
                <Field label={tx("Medicine name")}><Input value={d.name} onChange={e => setDraft({ name: e.target.value })} /></Field>
                <Field label={tx("Hospital/clinic instruction")}><select className={inputStyle} value={d.action ?? ''} onChange={e => setDraft({ action: (e.target.value || null) as MedicationDraft['action'] }, true)}>
                  <option value="">{tx("Choose the instruction")}</option><option value="take">{tx("Take")}</option><option value="hold">{tx("Do not take")}</option>
                </select></Field>
                {d.strength && <p className="text-[14px] text-ink-muted">{tx("Medicine details on sheet:")}{' '}{d.strength}</p>}
                {d.action && <>
                  {d.action === 'hold' ? <Field key="hold-start" label={tx("Stop taking from")} hint={tx("Choose the date and time your hospital/clinic gave you (Singapore time).")}>
                    <Input type="datetime-local" max={`${procedure.date}T23:59`} className="min-w-0"
                      defaultValue={resolveMedicationDate(d.start, procedure.date) && d.startTime ? `${resolveMedicationDate(d.start, procedure.date)}T${d.startTime}` : ''}
                      onChange={e => {
                        const [date, time] = e.target.value.split('T')
                        setDraft({ start: date || null, startTime: time || null })
                      }} />
                    {d.start && !d.startTime && <span className="mt-2 block text-[14px] text-ink-muted">{tx("Start date on sheet:")}{' '}{tx(resolveMedicationDate(d.start, procedure.date) ?? d.start)}{tx(". Complete the date and time above.")}</span>}
                  </Field> :
                    <Field key="take-start" label={tx("Start taking on")}>
                      <Input type="date" max={procedure.date} value={resolveMedicationDate(d.start, procedure.date) ?? ''} onChange={e => setDraft({ start: e.target.value || null })} />
                    </Field>
                  }
                  {d.action === 'hold' ? <div className="border-t border-hairline pt-4">
                    <Field label={tx("Remind me each day at")} hint={tx("Choose when you want a reminder not to take this medicine.")}>
                      <Input type="time" value={entry.reminderTimes[0] ?? ''} onChange={e => update({ ...entry, confirmed: false, reminderTimes: [e.target.value] })} />
                    </Field>
                    <p className="mt-2 text-[14px] text-ink-muted">{tx("If your reminder time is earlier than the hold starts, the first reminder will arrive when the hold starts.")}</p>
                  </div> : <div className="space-y-4 border-t border-hairline pt-4">
                    <h4 className="text-[16px] font-semibold">{tx("How much to take, and when")}</h4>
                    <p className="text-[14px] text-ink-muted">{tx("Copy each dose from your instructions. These times set your medication reminders.")}</p>
                    {entry.reminderTimes.map((time, i) => <div key={i} className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <Field label={tx(`Dose ${i + 1}`)}>
                          <Input placeholder={tx("e.g. 1 tablet")} value={entry.doseAmounts[i] ?? ''} onChange={e => update({ ...entry, confirmed: false, doseAmounts: entry.reminderTimes.map((_, j) => i === j ? e.target.value : entry.doseAmounts[j] ?? '') })} />
                        </Field>
                        <Field label={tx(`Take dose ${i + 1} at`)}>
                          <Input type="time" value={time} onChange={e => update({ ...entry, confirmed: false, reminderTimes: entry.reminderTimes.map((t, j) => i === j ? e.target.value : t) })} />
                        </Field>
                      </div>
                      {entry.reminderTimes.length > 1 && <button type="button" className="min-h-[44px] text-[14px] text-blue-deep underline" onClick={() => update({ ...entry, confirmed: false, draft: { ...d, frequency: entry.reminderTimes.length - 1 }, reminderTimes: entry.reminderTimes.filter((_, j) => i !== j), doseAmounts: entry.doseAmounts.filter((_, j) => i !== j) })}>{tx("Remove dose")}{' '}{tx(i + 1)}</button>}
                    </div>)}
                    <Button variant="secondary" disabled={entry.reminderTimes.length >= 8} onClick={() => update({ ...entry, confirmed: false, draft: { ...d, frequency: entry.reminderTimes.length + 1 }, reminderTimes: [...entry.reminderTimes, ''], doseAmounts: [...entry.doseAmounts, ''] })}>{tx("Add another daily dose")}</Button>
                  </div>}
                  {d.timing && <p className="text-[15px] text-ink-muted">{tx("Written instructions:")}{' '}{d.timing}</p>}
                  <p className="text-[14px] text-ink-muted">{tx("All times are Singapore time. Reminders run through")}{' '}{tx(resolveMedicationDate(d.end, procedure.date) && resolveMedicationDate(d.end, procedure.date)! < procedure.date ? resolveMedicationDate(d.end, procedure.date) : procedure.date)}{tx(". Follow the hospital/clinic’s instructions after that; this does not set a restart date.")}</p>
                  <details className="border-t border-hairline pt-3">
                    <summary className="min-h-[44px] cursor-pointer text-[15px] text-blue-deep">{tx("Earlier last day on your sheet?")}</summary>
                    <Field label={tx("Last day these instructions apply (if specified)")} hint={tx("Leave blank to show reminders through procedure day.")}>
                      <Input type="date" min={resolveMedicationDate(d.start, procedure.date) ?? undefined} value={resolveMedicationDate(d.end, procedure.date) ?? ''} onChange={e => setDraft({ end: e.target.value || null })} />
                    </Field>
                  </details>
                </>}
                {issues.length > 0 && <Notice tone="alert"><p className="font-semibold">{tx("Not ready to add")}</p><ul className="mt-2 list-disc space-y-1 pl-4">{issues.map(issue => <li key={issue}>{tx(issue)}</li>)}</ul>
                  {d.issues.length > 0 && <p className="mt-2">{tx("Retake the photo with clearer instructions to resolve the flagged items.")}</p>}</Notice>}
                <Button disabled={issues.length > 0 || busy} onClick={() => { update({ ...entry, confirmed: true }); setMessage(`${d.name} added. Your plan now includes these reminders.`) }}>{tx("I checked this — add to my plan")}</Button>
              </div>}
            </article>
          })}
          {hasDepartmentPhone(procedure) && <a className="inline-flex min-h-[48px] items-center text-blue-deep underline" href={`tel:${procedure.departmentPhone}`}>{tx("Questions about your medicines? Call the hospital/clinic")}</a>}
        </div>}
      </div>}
    </section>
  )
}
