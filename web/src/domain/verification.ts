import type { BowelScalePoint } from './progress.ts'

/**
 * Reading a photograph onto the department's own scale.
 *
 * ── What this is not ──────────────────────────────────────────────────────
 *
 * It does not decide whether anyone is ready, and it never tells a patient
 * their procedure will or will not go ahead. That rule is not a preference: it
 * is written into the assistant's system prompt as an absolute, and enforced
 * again after generation by a guardrail named `no-photo-verdict` in
 * `api/ask/guardrails.test.mjs`. A photo-reading feature that contradicted it
 * would leave the app saying two different things in two different tabs.
 *
 * So the model does exactly one job: propose a point on the **1-5 scale the
 * hospitals already use**, which the patient could have chosen themselves from
 * the swatches, and say how sure it is. The patient confirms or overrides it.
 * What is stored is what the patient accepted, exactly as if they had tapped
 * the swatch -- so it flows into the same `bowelOutput` signal and the same
 * flag the ward already reads, rather than a second opinion running alongside.
 *
 * The model's own reading is kept too, but only so staff can see where it
 * disagreed with the patient. Disagreement is the interesting signal here.
 */

/** Below this, the model is guessing and a person should look. */
export const LOW_CONFIDENCE = 0.5

/**
 * At or below this the preparation is not working yet.
 *
 * Chosen to match `progress.ts`: `bowelOutput` is `(point - 1) / 4`, and
 * `RED_BELOW` is 0.5, so a 2 is already a red flag by the existing rules. This
 * constant exists to say *why* in the staff view, not to invent a new
 * threshold beside the one the ward uses.
 */
export const LOW_READING: BowelScalePoint = 2

/** A gap this wide between the model and the patient is worth a person's time. */
export const DISAGREEMENT = 2

export type Assessment = {
  /** False when the photograph cannot be read at all -- too dark, not a toilet. */
  readonly usable: boolean
  readonly point: BowelScalePoint | null
  /** 0 to 1. The model's own confidence, not a probability of anything clinical. */
  readonly confidence: number
  /** One short sentence, for the patient. Never a verdict. */
  readonly note: string
}

export type FlagReason = 'low-reading' | 'low-confidence' | 'unusable' | 'disagreement'

export type Verification = {
  readonly assessment: Assessment
  /** What the patient actually accepted, which is what gets recorded. */
  readonly accepted: BowelScalePoint | null
  readonly flagged: boolean
  readonly reasons: readonly FlagReason[]
}

function isPoint(value: unknown): value is BowelScalePoint {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
}

/**
 * The model's reply, which is JSON from a language model and therefore not to
 * be trusted to be any particular shape.
 *
 * Anything malformed comes back as unusable with no confidence rather than
 * throwing: a patient who photographed their toilet at 1am should get "we
 * could not read that, use the swatches instead", not an error page.
 */
export function parseAssessment(raw: unknown): Assessment {
  const unreadable: Assessment = { usable: false, point: null, confidence: 0, note: '' }
  if (typeof raw !== 'object' || raw === null) return unreadable

  const value = raw as Record<string, unknown>
  const point = isPoint(value.point) ? value.point : null
  const confidence =
    typeof value.confidence === 'number' && Number.isFinite(value.confidence)
      ? Math.min(1, Math.max(0, value.confidence))
      : 0

  // A reading with no point is not a reading, whatever the model claimed.
  const usable = value.usable === true && point !== null

  return {
    usable,
    point,
    confidence: usable ? confidence : 0,
    note: typeof value.note === 'string' ? value.note.slice(0, 300) : '',
  }
}

/**
 * Whether a person should look at this, and why.
 *
 * Erring towards flagging. A flag costs a nurse a glance at a dashboard; a
 * missed one costs a patient a cancelled procedure and another bowel
 * preparation, which is the outcome this whole app exists to avoid.
 */
export function verificationOf(
  assessment: Assessment,
  accepted: BowelScalePoint | null,
): Verification {
  const reasons: FlagReason[] = []

  if (!assessment.usable) {
    reasons.push('unusable')
  } else {
    if (assessment.confidence < LOW_CONFIDENCE) reasons.push('low-confidence')

    // The recorded point is what matters clinically, so it is the one checked.
    const reading = accepted ?? assessment.point
    if (reading !== null && reading <= LOW_READING) reasons.push('low-reading')

    if (
      accepted !== null &&
      assessment.point !== null &&
      Math.abs(accepted - assessment.point) >= DISAGREEMENT
    ) {
      reasons.push('disagreement')
    }
  }

  return { assessment, accepted, flagged: reasons.length > 0, reasons }
}

/** How each flag is put to staff, in the admin view. */
export const FLAG_REASON_COPY: Readonly<Record<FlagReason, string>> = {
  'low-reading': 'The preparation does not look to be working yet.',
  'low-confidence': 'The photograph was hard to read, so this reading is uncertain.',
  unusable: 'The photograph could not be read at all.',
  disagreement: 'The patient recorded a very different reading from the photograph.',
}
