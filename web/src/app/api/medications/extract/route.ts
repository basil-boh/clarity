import { readLanguage } from '@/lib/language'
import { NextResponse } from 'next/server'
import { readSession } from '@/lib/session'
import { findPatient } from '@/lib/patients'
import { extractMedications, extractionFailure, readMedicationImages } from '@/lib/medication-extraction'

export const runtime = 'nodejs'

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  const session = await readSession()
  if (!session) return json({ error: 'Please sign in again before uploading.' }, 401)
  const origin = request.headers.get('origin')
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Upload from the Plan page.' }, 403)
  const patient = await findPatient(session.phone)
  if (!patient) return json({ error: 'No procedure is available for this account.' }, 404)
  const key = process.env.OPENAI_API_KEY
  if (!key) return json({ error: 'Photo reading is not switched on in this build. Your existing preparation plan is still available.' }, 503)
  let images
  try { images = await readMedicationImages(request) }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Choose supported photos and try again.' }, 400) }
  try {
    const medications = await extractMedications(images, key, process.env.OPENAI_MEDICATION_MODEL ?? 'gpt-4o-mini', fetch, await readLanguage())
    return json({ medications, procedureDate: patient.procedure.date })
  } catch (error) {
    const failure = extractionFailure(error)
    console.warn('[clarity] medication extraction failed', failure.diagnostic)
    return json({ error: failure.message, code: failure.diagnostic.kind }, failure.status)
  }
}
