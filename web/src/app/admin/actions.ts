'use server'

import { isValid, parseISO } from 'date-fns'
import { notFound, redirect } from 'next/navigation'

import {
  adminEnabled,
  clearAdminSession,
  createAdminSession,
  createPatient,
  deletePatient,
  passwordMatches,
  requireAdmin,
  resetRecorded,
  updatePatient,
  type PatientInput,
} from '@/lib/admin'
import { normalisePhone } from '@/lib/phone'
import { usingDatabase } from '@/lib/source'

/**
 * Every action here is a public POST endpoint in its own right -- Next.js does
 * not route it through the page that rendered the form -- so each one checks
 * the admin cookie itself rather than trusting that the page already did.
 */

// ---------------------------------------------------------------------------
// Signing in
// ---------------------------------------------------------------------------

export type SignInState = { error?: string }

export async function signIn(_: SignInState, form: FormData): Promise<SignInState> {
  if (!adminEnabled()) notFound()
  if (!passwordMatches(String(form.get('password') ?? ''))) {
    // Not a lockout, just enough to make guessing slow.
    await new Promise((resolve) => setTimeout(resolve, 800))
    return { error: 'That password is not right.' }
  }
  await createAdminSession()
  redirect('/admin')
}

export async function signOut(): Promise<void> {
  await clearAdminSession()
  redirect('/admin')
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export type PatientField = keyof PatientInput
export type PatientValues = Record<PatientField, string>

export type PatientFormState = {
  error?: string
  errors?: Partial<Record<PatientField, string>>
  /**
   * What was submitted, handed back so the form can show it again. React
   * resets a form after its action runs, and a rejected save that blanked every
   * field would be worse than no validation at all.
   */
  values?: PatientValues
}

const FIELDS: readonly PatientField[] = [
  'phone',
  'displayName',
  'reader',
  'date',
  'arriveAt',
  'hospital',
  'location',
  'departmentPhone',
]

/** A department line is usually a landline, which `normalisePhone` rejects. */
function departmentLine(raw: string): string | null {
  const plus = raw.startsWith('+')
  const digits = raw.replace(/\D/g, '')
  if (plus) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  if (digits.length === 8) return `+65${digits}`
  return null
}

function parse(form: FormData): { input: PatientInput } | { errors: PatientFormState['errors'] } {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(form.get(field) ?? '').trim()]),
  ) as PatientValues
  const errors: Partial<Record<PatientField, string>> = {}

  const phone = normalisePhone(values.phone)
  if (!phone.ok) errors.phone = phone.error

  if (!values.displayName) errors.displayName = 'Enter a name.'
  else if (values.displayName.length > 80) errors.displayName = 'Keep the name under 80 characters.'

  if (values.reader !== 'patient' && values.reader !== 'caregiver') {
    errors.reader = 'Choose who reads the app.'
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !isValid(parseISO(values.date))) {
    errors.date = 'Choose a procedure date.'
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.arriveAt)) errors.arriveAt = 'Choose a time.'

  if (!values.hospital) errors.hospital = 'Enter the hospital.'
  else if (values.hospital.length > 120) errors.hospital = 'Keep this under 120 characters.'

  if (values.location.length > 160) errors.location = 'Keep this under 160 characters.'

  const line = departmentLine(values.departmentPhone)
  if (!line) errors.departmentPhone = 'Enter an 8-digit number, or the full number with +.'

  if (Object.keys(errors).length > 0) return { errors }
  return {
    input: {
      ...values,
      phone: phone.ok ? phone.e164 : '',
      reader: values.reader as PatientInput['reader'],
      departmentPhone: line!,
    },
  }
}

export async function savePatient(
  _: PatientFormState,
  form: FormData,
): Promise<PatientFormState> {
  await requireAdmin()
  if (!usingDatabase()) return { error: 'There is no database to save to.' }

  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(form.get(field) ?? '')]),
  ) as PatientValues
  const parsed = parse(form)
  if ('errors' in parsed) return { errors: parsed.errors, values }

  try {
    if (form.get('mode') === 'create') {
      const result = await createPatient(parsed.input)
      if (result === 'exists') {
        return { errors: { phone: 'That number is already a patient. Edit them instead.' }, values }
      }
    } else {
      const result = await updatePatient(parsed.input)
      if (result === 'missing') return { error: 'That patient has been deleted.', values }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save.', values }
  }

  redirect(`/admin/patients/${parsed.input.phone.slice(1)}?done=saved`)
}

/** The phone arrives in a hidden field; normalised again rather than trusted. */
function phoneFrom(form: FormData): string {
  const phone = normalisePhone(String(form.get('phone') ?? ''))
  if (!phone.ok) notFound()
  return phone.e164
}

export async function removePatient(form: FormData): Promise<void> {
  await requireAdmin()
  await deletePatient(phoneFrom(form))
  redirect('/admin?done=deleted')
}

export async function resetPatient(form: FormData): Promise<void> {
  await requireAdmin()
  const phone = phoneFrom(form)
  await resetRecorded(phone)
  redirect(`/admin/patients/${phone.slice(1)}?done=reset`)
}
