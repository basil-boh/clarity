import 'server-only'

import type { BowelScalePoint } from '@/domain/progress'
import { verificationOf, type Assessment, type FlagReason, type Verification } from '@/domain/verification'
import { usingDatabase } from '@/lib/source'
import { db, logDbError, patientScope } from '@/lib/supabase'

/**
 * Photograph readings, kept without the photograph.
 *
 * One row per reading. The model's proposal is written when the image is read;
 * `accepted_point` and the final flag are filled in when the patient confirms,
 * which is a separate act and may never happen.
 */

function logError(action: string, error: unknown) {
  const code = (error as { code?: string } | null)?.code
  const missing = code === '42P01' || code === 'PGRST205'
  logDbError(
    missing ? 'web_verifications missing, apply 0005_verification.sql' : `web_verifications ${action}`,
    error,
  )
}

export async function saveVerification(
  phone: string,
  verification: Verification,
): Promise<string | null> {
  if (!usingDatabase()) return null

  const { assessment } = verification
  const { data, error } = await db()
    .from('web_verifications')
    .insert({
      phone,
      suggested_point: assessment.point,
      confidence: assessment.confidence,
      usable: assessment.usable,
      note: assessment.note,
      accepted_point: verification.accepted,
      flagged: verification.flagged,
      flag_reasons: [...verification.reasons],
    })
    .select('id')
    .maybeSingle<{ id: string }>()

  if (error) {
    logError('insert', error)
    return null
  }
  return data?.id ?? null
}

/**
 * The patient confirmed, or overrode, a reading.
 *
 * The flag is recomputed rather than left as it was: a patient who overrides a
 * 5 with a 1 has just told us something the photograph did not, and a patient
 * who accepts a clear reading should not stay flagged for a disagreement that
 * never happened.
 */
export async function acceptVerification(
  phone: string,
  id: string,
  accepted: BowelScalePoint,
): Promise<boolean> {
  if (!usingDatabase()) return false

  // Not through `patientScope`, which fixes the filter set at one column. The
  // phone is still matched explicitly, so an id belonging to another patient
  // cannot be reached from here.
  const { data, error } = await db()
    .from('web_verifications')
    .select('id, suggested_point, confidence, usable, note')
    .eq('phone', phone)
    .eq('id', id)
    .maybeSingle<{
      id: string
      suggested_point: number | null
      confidence: number
      usable: boolean
      note: string
    }>()

  if (error) {
    logError('accept lookup', error)
    return false
  }
  // Scoped to this patient's rows, so an id belonging to someone else simply
  // is not found rather than being updated.
  if (!data) return false

  const assessment: Assessment = {
    usable: data.usable,
    point: (data.suggested_point ?? null) as BowelScalePoint | null,
    confidence: data.confidence,
    note: data.note,
  }
  const verification = verificationOf(assessment, accepted)

  const { error: writeError } = await db()
    .from('web_verifications')
    .update({
      accepted_point: accepted,
      flagged: verification.flagged,
      flag_reasons: [...verification.reasons],
    })
    .eq('id', id)
    .eq('phone', phone)

  if (writeError) {
    logError('accept write', writeError)
    return false
  }
  return true
}

export type StoredVerification = {
  readonly id: string
  readonly assessedAt: string
  readonly suggestedPoint: BowelScalePoint | null
  readonly acceptedPoint: BowelScalePoint | null
  readonly confidence: number
  readonly usable: boolean
  readonly note: string
  readonly flagged: boolean
  readonly reasons: readonly FlagReason[]
}

type Row = {
  id: string
  phone: string
  assessed_at: string
  suggested_point: number | null
  accepted_point: number | null
  confidence: number
  usable: boolean
  note: string
  flagged: boolean
  flag_reasons: string[] | null
}

const REASONS = new Set<FlagReason>(['low-reading', 'low-confidence', 'unusable', 'disagreement'])

function fromRow(row: Row): StoredVerification {
  return {
    id: row.id,
    assessedAt: row.assessed_at,
    suggestedPoint: (row.suggested_point ?? null) as BowelScalePoint | null,
    acceptedPoint: (row.accepted_point ?? null) as BowelScalePoint | null,
    confidence: row.confidence,
    usable: row.usable,
    note: row.note,
    flagged: row.flagged,
    reasons: (row.flag_reasons ?? []).filter((r): r is FlagReason => REASONS.has(r as FlagReason)),
  }
}

/** This patient's readings, most recent first. */
export async function verificationsFor(
  phone: string,
  limit = 5,
): Promise<StoredVerification[]> {
  if (!usingDatabase()) return []
  const { data, error } = await patientScope(phone)
    .select<Row>(
      'web_verifications',
      'id, phone, assessed_at, suggested_point, accepted_point, confidence, usable, note, flagged, flag_reasons',
    )
    .order('assessed_at', { ascending: false })
    .limit(limit)
  if (error) {
    logError('read', error)
    return []
  }
  return (data ?? []).map(fromRow)
}

/**
 * Everyone a person should look at, across all patients. `/admin` only.
 *
 * Every caller sits behind `requireAdmin()`. Ordered most recent first, because
 * a flag from tonight's purge is actionable and one from last week is history.
 */
export async function flaggedVerifications(limit = 50): Promise<(StoredVerification & { phone: string })[]> {
  if (!usingDatabase()) return []
  const { data, error } = await db()
    .from('web_verifications')
    .select(
      'id, phone, assessed_at, suggested_point, accepted_point, confidence, usable, note, flagged, flag_reasons',
    )
    .eq('flagged', true)
    .order('assessed_at', { ascending: false })
    .limit(limit)
    .returns<Row[]>()
  if (error) {
    logError('flagged read', error)
    return []
  }
  return (data ?? []).map((row) => ({ ...fromRow(row), phone: row.phone }))
}
