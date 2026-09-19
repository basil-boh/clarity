'use client'

import { useActionState, useState } from 'react'

import { Button, Card, Field, Input, Notice, SectionTitle, Select } from '@/components/ui'
import { PHASE_COPY, dateFromToday, offsetFor, phaseFor } from '@/domain/prep'
import { formatPhone } from '@/lib/phone'

import { savePatient, type PatientFormState, type PatientValues } from './actions'

/**
 * Days until the procedure that land a patient in each phase today. The labels
 * come from `PHASE_COPY`, so a shortcut always says what the patient will see.
 */
const SHORTCUTS = [30, 6, 3, 1, 0, -1] as const

function whenLabel(days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return `in ${days} days`
}

export function PatientForm({
  mode,
  initial,
}: {
  mode: 'create' | 'update'
  initial: PatientValues
}) {
  const [state, action, pending] = useActionState<PatientFormState, FormData>(savePatient, {})
  const [date, setDate] = useState(initial.date)
  const values = state.values ?? initial
  const errors = state.errors ?? {}
  const offset = /^\d{4}-\d{2}-\d{2}$/.test(date) ? offsetFor(date) : null

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="mode" value={mode} />

      {state.error ? <Notice tone="alert">{state.error}</Notice> : null}

      <Card>
        <SectionTitle>Patient</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          {mode === 'create' ? (
            <Field label="Mobile number" hint="The number they sign in with." error={errors.phone}>
              <Input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder="9123 4567"
                defaultValue={values.phone}
                required
              />
            </Field>
          ) : (
            <div>
              <span className="mb-1.5 block text-[15px] font-semibold text-ink">Mobile number</span>
              <span className="mb-2 block text-[15px] text-ink-muted">
                To change it, delete this patient and add them again.
              </span>
              <div className="py-3.5 font-mono text-[19px] text-ink">
                {formatPhone(initial.phone)}
              </div>
              <input type="hidden" name="phone" value={initial.phone} />
            </div>
          )}

          <Field label="Name" hint="Shown to the patient." error={errors.displayName}>
            <Input name="displayName" defaultValue={values.displayName} required />
          </Field>

          <Field label="Who reads the app" error={errors.reader}>
            <Select name="reader" defaultValue={values.reader}>
              <option value="patient">The patient</option>
              <option value="caregiver">A caregiver</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <SectionTitle>Procedure</SectionTitle>

        <Field label="Procedure date" error={errors.date}>
          <Input
            type="date"
            name="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </Field>

        <div className="mt-3">
          <span className="mb-2 block text-[15px] text-ink-muted">
            Or put them in a stage of the prep today:
          </span>
          <div className="flex flex-wrap gap-2">
            {SHORTCUTS.map((days) => {
              const target = dateFromToday(days)
              const active = date === target
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDate(target)}
                  aria-pressed={active}
                  className={
                    'min-h-[44px] rounded-full border px-4 text-[15px] font-semibold transition-colors ' +
                    (active
                      ? 'border-blue bg-blue-wash text-blue-deep'
                      : 'border-hairline-strong bg-paper text-ink hover:bg-paper-sunken')
                  }
                >
                  {PHASE_COPY[phaseFor(-days)].name}{' '}
                  <span className="font-normal text-ink-muted">({whenLabel(days)})</span>
                </button>
              )
            })}
          </div>
        </div>

        {offset !== null ? (
          <p className="mt-4 text-[15px] text-ink-muted">
            Today the patient sees:{' '}
            <strong className="font-semibold text-ink">{PHASE_COPY[phaseFor(offset)].name}</strong>
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Arrive at" error={errors.arriveAt}>
            <Input type="time" name="arriveAt" defaultValue={values.arriveAt} required />
          </Field>

          <Field label="Department phone" error={errors.departmentPhone}>
            <Input
              name="departmentPhone"
              type="tel"
              inputMode="tel"
              placeholder="6326 5656"
              defaultValue={values.departmentPhone}
              required
            />
          </Field>

          <Field label="Hospital" error={errors.hospital}>
            <Input name="hospital" defaultValue={values.hospital} required />
          </Field>

          <Field label="Where to go" error={errors.location}>
            <Input
              name="location"
              placeholder="Block, level, centre"
              defaultValue={values.location}
            />
          </Field>
        </div>
      </Card>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : mode === 'create' ? 'Add patient' : 'Save changes'}
      </Button>
    </form>
  )
}
