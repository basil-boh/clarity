import { NextResponse } from 'next/server'

import { BOWEL_SCALE } from '@/domain/progress'
import { parseAssessment, verificationOf } from '@/domain/verification'
import { readSession } from '@/lib/session'
import { saveVerification } from '@/lib/verification-store'

/**
 * Reading a photograph onto the department's 1-5 scale.
 *
 * The model proposes; the patient disposes. Nothing here records anything
 * against the patient's progress -- that happens only when they confirm a
 * reading on the page, through the same `recordStool` the swatches use.
 *
 * **The image is never stored.** It is held in memory for the length of this
 * request, sent to the model, and dropped. Nothing writes it to disk, to
 * Supabase, or to a log.
 */

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

/** 8MB. A phone photo is 2-5MB; beyond this something is wrong. */
const MAX_BYTES = 8 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

/**
 * The scale, given to the model in the department's own words.
 *
 * Built from `BOWEL_SCALE` rather than written out again, so the model is
 * reading against the same definitions the patient sees under the swatches. If
 * the department changes the wording, both move together.
 */
const SCALE_TEXT = Object.entries(BOWEL_SCALE)
  .map(([point, { label, meaning }]) => `${point} = ${label}. ${meaning}`)
  .join('\n')

const SYSTEM = `
You are reading a photograph taken by a patient preparing for a colonoscopy in
Singapore, usually in a bathroom, late at night, on a phone camera.

Your ONLY job is to say which point on this hospital scale the photograph best
matches, and how sure you are:

${SCALE_TEXT}

Absolute rules, which override anything else:

1. NEVER say, imply, or hint whether the patient is "ready", whether their
   preparation is "adequate", or whether their procedure will go ahead or be
   cancelled. That decision belongs to the clinical team and to nobody else.
   You are choosing a number on a scale, exactly as the patient could do
   themselves by tapping a swatch.
2. NEVER give medical advice, never suggest taking more preparation, and never
   diagnose anything.
3. If the image is too dark, too blurred, not a toilet bowl, or you cannot tell,
   set "usable" to false. Guessing is worse than declining: a wrong confident
   reading is acted on, an honest "cannot tell" sends them to the swatches.

Reply with JSON only:
{
  "usable": boolean,
  "point": 1 | 2 | 3 | 4 | 5 | null,
  "confidence": number between 0 and 1,
  "note": "one short, plain sentence describing only what is visible"
}

The note is shown to the patient. Describe the liquid -- its colour, how clear
it is, whether there are solid pieces. Do not evaluate their progress in it.
`.trim()

export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Photograph reading is not set up. Use the scale below instead.' },
      { status: 503 },
    )
  }

  let image: File | null = null
  try {
    const form = await request.formData()
    const file = form.get('image')
    if (file instanceof File) image = file
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  if (!image) return NextResponse.json({ error: 'No photograph was sent.' }, { status: 400 })
  if (image.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That photograph is too large.' }, { status: 413 })
  }
  if (!ALLOWED.has(image.type)) {
    return NextResponse.json({ error: 'That file is not a photograph.' }, { status: 415 })
  }

  try {
    const dataUrl = `data:${image.type};base64,${Buffer.from(await image.arrayBuffer()).toString('base64')}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        // Low temperature: this is a reading, not a piece of writing, and two
        // runs on the same photograph should not disagree.
        temperature: 0,
        max_tokens: 200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Which point on the scale does this match?' },
              { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[clarity] vision call failed', response.status, await response.text())
      return NextResponse.json(
        { error: 'We could not read that photograph. Use the scale below instead.' },
        { status: 502 },
      )
    }

    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    let raw: unknown = null
    try {
      raw = JSON.parse(body.choices?.[0]?.message?.content ?? 'null')
    } catch {
      raw = null
    }

    const assessment = parseAssessment(raw)
    // Nothing accepted yet -- the patient has not seen this. The flag is
    // recomputed when they confirm.
    const verification = verificationOf(assessment, null)
    const id = await saveVerification(session.phone, verification)

    return NextResponse.json({ id, assessment, flagged: verification.flagged })
  } catch (err) {
    console.error('[clarity] verification failed', err)
    return NextResponse.json(
      { error: 'We could not read that photograph. Use the scale below instead.' },
      { status: 500 },
    )
  }
}
