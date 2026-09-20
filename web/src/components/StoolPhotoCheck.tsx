'use client'

import { useRef, useState } from 'react'

import { Button, Card } from '@/components/ui'
import { BOWEL_SCALE, type BowelScalePoint } from '@/domain/progress'
import type { Assessment } from '@/domain/verification'

/**
 * Reading the photograph, and then getting out of the way.
 *
 * The model's number is offered, never applied. What the patient taps is what
 * is recorded, through the same action the swatches use -- so a reading that
 * came from a photograph and one that came from a swatch are the same kind of
 * thing downstream, and the ward reads one number rather than two.
 *
 * The photograph itself never leaves this request. It is not previewed from a
 * stored URL, not uploaded to a bucket, and not kept after the reply comes
 * back: the preview below is a local object URL, revoked when it is replaced.
 *
 * Nothing here says "ready". The word does not appear, because whether a
 * preparation is adequate is a clinical judgement and the app makes a point of
 * not pretending otherwise -- see the `no-photo-verdict` guardrail on the
 * assistant.
 */
export function StoolPhotoCheck({
  onAccept,
}: {
  onAccept: (id: string, point: BowelScalePoint) => Promise<void>
}) {
  const input = useRef<HTMLInputElement>(null)
  const preview = useRef<string | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ id: string; assessment: Assessment } | null>(null)
  const [accepted, setAccepted] = useState<BowelScalePoint | null>(null)

  function showPreview(file: File) {
    if (preview.current) URL.revokeObjectURL(preview.current)
    preview.current = URL.createObjectURL(file)
    setPreviewUrl(preview.current)
  }

  async function read(file: File) {
    setBusy(true)
    setError(null)
    setResult(null)
    setAccepted(null)
    showPreview(file)

    try {
      const body = new FormData()
      body.append('image', file)
      const response = await fetch('/api/verify', { method: 'POST', body })
      const data = (await response.json()) as {
        id?: string
        assessment?: Assessment
        error?: string
      }

      if (!response.ok || !data.assessment) {
        setError(data.error ?? 'We could not read that photograph.')
        return
      }
      setResult({ id: data.id ?? '', assessment: data.assessment })
    } catch {
      setError('We could not read that photograph. Check your connection.')
    } finally {
      setBusy(false)
    }
  }

  async function accept(point: BowelScalePoint) {
    if (!result?.id) return
    setAccepted(point)
    await onAccept(result.id, point)
  }

  const suggestion = result?.assessment

  return (
    <Card>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        // `capture` opens the camera directly on a phone, which is where this
        // is used. Left off desktop, where it would be meaningless.
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void read(file)
        }}
      />

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local object
        // URL, never a stored image; next/image would want a real source.
        <img
          src={previewUrl}
          alt="The photograph you just took"
          className="mb-4 max-h-[220px] w-full rounded-lg object-cover"
        />
      ) : null}

      <Button type="button" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? 'Reading…' : previewUrl ? 'Take another' : 'Take a photograph'}
      </Button>

      {error ? (
        <p role="alert" className="mt-3 text-[15px] font-medium text-flag-red">
          {error} You can use the scale below instead.
        </p>
      ) : null}

      {suggestion && !suggestion.usable ? (
        <p className="mt-4 text-[16px] leading-relaxed text-ink-muted">
          That photograph could not be read — too dark, or too close. Try again in better light, or
          just use the scale below.
        </p>
      ) : null}

      {suggestion?.usable && suggestion.point ? (
        <div className="mt-5">
          <p className="text-[15px] font-semibold text-ink-muted">
            This looks closest to
          </p>
          <p className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-ink">
            {suggestion.point} · {BOWEL_SCALE[suggestion.point].label}
          </p>
          {suggestion.note ? (
            <p className="mt-2 text-[16px] leading-relaxed text-ink-muted">{suggestion.note}</p>
          ) : null}

          <p className="mt-4 text-[15px] leading-relaxed text-ink-faint">
            This is a reading of the picture, not a judgement about your preparation. Confirm it, or
            pick a different one — what you choose is what your team sees.
          </p>

          <div className="mt-4 grid grid-cols-5 gap-1.5">
            {([1, 2, 3, 4, 5] as BowelScalePoint[]).map((point) => (
              <button
                key={point}
                type="button"
                onClick={() => void accept(point)}
                aria-label={`${point}, ${BOWEL_SCALE[point].label}`}
                className={`min-h-[52px] rounded-lg border text-[17px] font-semibold transition-colors ${
                  accepted === point
                    ? 'border-blue bg-blue text-white'
                    : point === suggestion.point
                      ? 'border-blue bg-blue-wash text-ink'
                      : 'border-hairline-strong bg-paper text-ink'
                }`}
              >
                {point}
              </button>
            ))}
          </div>

          {accepted ? (
            <p className="mt-3 text-[15px] font-medium text-ink">
              Recorded as {accepted} · {BOWEL_SCALE[accepted].label}.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-5 text-[14px] leading-relaxed text-ink-faint">
        The photograph is read and then discarded. It is never saved, and your team sees only the
        number.
      </p>
    </Card>
  )
}
