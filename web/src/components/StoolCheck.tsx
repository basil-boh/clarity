'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Card } from '@/components/ui'
import { CLARITIES, COLOURS, CONSISTENCIES, REASONS, REASON_HINTS, guidanceFor, parseStoolCheck, type StoolCheck as Check } from '@/domain/stool-check'

const SWATCHES: Partial<Record<Check['colour'], string>> = {
  orange: '#E6B36C', yellow: '#F2E6B4', green: '#B5BB70', brown: '#987344', dark: '#3B3633', red: '#B65252', colourless: '#F3F5F4',
}

export function StoolCheck({ saved, onSave, departmentPhone }: {
  saved: Check | null
  onSave: (check: Check) => Promise<void>
  departmentPhone?: string
}) {
  const [answers, setAnswers] = useState<Partial<Check>>({})
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [recorded, setRecorded] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (step > 0) heading.current?.focus() }, [step])
  const check = parseStoolCheck(answers)
  const result = check ? guidanceFor(check) : null
  const options = step === 0 ? REASONS : step === 1 ? COLOURS : step === 2 ? CONSISTENCIES : CLARITIES
  const key = (['reason', 'colour', 'consistency', 'clarity'] as const)[Math.min(step, 3)]
  const questions = [
    'What makes you think your preparation is working?',
    'What colour was the output on your latest trip?',
    'What was its consistency?',
    'Could you see through the liquid?',
  ]

  function choose(value: string) {
    setAnswers(current => ({ ...current, [key]: value, ...(key === 'consistency' ? { clarity: null } : {}) }))
    setError('')
    setRecorded(false)
  }
  function next() {
    setStep(step === 2 && answers.consistency !== 'watery' && answers.consistency !== 'flecks' ? 4 : step + 1)
  }
  async function save() {
    if (!check) return
    setBusy(true)
    setError('')
    try { await onSave(check); setRecorded(true) }
    catch { setError('Could not save your check-in. Please try again.') }
    finally { setBusy(false) }
  }

  return (
    <Card>
      {saved && step === 0 ? <p className="mb-4 text-[14px] text-ink-muted">Last saved check: {COLOURS[saved.colour]} · {CONSISTENCIES[saved.consistency]}{saved.clarity ? ` · ${CLARITIES[saved.clarity]}` : ''}</p> : null}
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.11em] text-ink-faint">{step < 4 ? `Question ${step + 1}` : 'Your check-in'}</p>
      <h3 ref={heading} tabIndex={-1} className="text-[22px] font-bold tracking-[-0.02em] text-ink outline-none">{step < 4 ? questions[step] : result?.title}</h3>
      {step === 0 ? <p className="mt-2 text-[15px] text-ink-muted">Choose the closest answer. We will guide you from there.</p> : null}
      {step === 1 && answers.reason ? <p className="mt-3 rounded-lg bg-blue-wash p-3 text-[15px] leading-relaxed text-ink">{REASON_HINTS[answers.reason]}</p> : null}
      {step === 2 ? <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">Iron tablets and some foods can darken output; bile can tint it yellow-green. Colour alone cannot tell us whether your bowel is clear.</p> : null}
      {step < 4 ? (
        <>
          <div role="group" aria-label={questions[step]} className="my-5 space-y-2">
            {Object.entries(options).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={answers[key] === value} onClick={() => choose(value)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-[16px] font-medium ${answers[key] === value ? 'border-blue bg-blue-wash text-blue' : 'border-hairline-strong text-ink hover:bg-paper-sunken'}`}>
                {step === 1 && SWATCHES[value as Check['colour']] ? <span aria-hidden className="h-6 w-6 shrink-0 rounded-full border border-hairline" style={{ background: SWATCHES[value as Check['colour']] }} /> : null}
                {label}
              </button>
            ))}
          </div>
          <Button type="button" disabled={!answers[key]} onClick={next}>Continue</Button>
        </>
      ) : check && result ? (
        <>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-muted">{result.detail}</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{check.reason === 'frequency' ? 'The number of toilet trips does not confirm readiness. Focus on whether the latest output is watery and clear.' : check.reason === 'colour' ? 'Colour alone can mislead. Watery consistency and see-through clarity matter together.' : 'Judge the latest output, rather than the number of trips or its colour alone.'}</p>
          <p className="my-4 rounded-lg bg-paper-sunken p-3 text-[15px] text-ink">Your answers: {COLOURS[check.colour]} · {CONSISTENCIES[check.consistency]}{check.clarity ? ` · ${CLARITIES[check.clarity]}` : ''}</p>
          <Button type="button" disabled={busy || recorded} onClick={() => void save()}>{busy ? 'Saving…' : recorded ? 'Check-in saved' : 'Save my check-in'}</Button>
          <p role="status" className="mt-2 text-[14px] text-ink-muted">{recorded ? 'Saved. You can check again after your next trip.' : ''}</p>
          {error ? <p role="alert" className="mt-2 text-[15px] text-flag-red">{error}</p> : null}
          {result.contact ? (departmentPhone ? <a href={`tel:${departmentPhone}`} className="mt-3 inline-flex min-h-[48px] items-center font-semibold text-blue">Call the department →</a> : <p className="mt-3 text-[15px] text-ink-muted">Use the department number on your appointment letter.</p>) : null}
          <p className="mt-4 text-[14px] leading-relaxed text-ink-faint">Do not take extra preparation or change medicines based on this check. Your clinical team decides whether your bowel preparation is adequate.</p>
          {recorded ? <button type="button" className="mt-3 min-h-[44px] font-semibold text-blue" onClick={() => { setStep(0); setAnswers({}); setRecorded(false) }}>Start a new check-in</button> : null}
        </>
      ) : null}
      {step > 0 && !recorded ? <button type="button" disabled={busy} className="mt-3 min-h-[44px] font-semibold text-blue" onClick={() => { setError(''); setStep(step === 4 && answers.consistency !== 'watery' && answers.consistency !== 'flecks' ? 2 : step - 1) }}>Back</button> : null}
    </Card>
  )
}
