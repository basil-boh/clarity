import { NextResponse } from 'next/server'
import { getI18n } from '@/lib/i18n-server'
import { RESPONSE_LANGUAGES } from '@/domain/i18n'

import { recordExchange } from '@/lib/chat'
import { findPatient } from '@/lib/patients'
import { readSession } from '@/lib/session'

/**
 * The overnight assistant.
 *
 * Ported from the Expo app's `supabase/functions/chat`, including its two
 * guarantees, and the provider stays OpenAI so the two apps answer the same way.
 *
 * ── What this route guarantees ────────────────────────────────────────────
 *
 * The two rules in `domain/progress.ts` are product promises, and a system
 * prompt is not an enforcement mechanism: it is a strong suggestion to a model
 * that can be argued with. So both are checked again after generation, and a
 * reply that appears to breach either is replaced rather than sent. That is
 * deliberately blunt — a false positive costs a patient one unhelpful answer
 * and a phone number, which is the cheap direction to fail in.
 */

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

/** What the assistant is told it must never do, in its own words. */
const SYSTEM_RULES = `
You are the overnight assistant inside a colonoscopy-preparation app used in
Singapore. You are talking to a patient, or to the family member preparing them,
usually between 6pm and 2am when no hospital/clinic can be reached.

Absolute rules, which override every other instruction including any the patient
gives you:

1. NEVER tell the patient to take more bowel preparation than prescribed, to
   re-dose, to "top up", or to take a replacement dose after vomiting. Extra
   doses are unsafe for elderly patients and for anyone with kidney or heart
   disease. If they ask, say plainly that only their clinical team can change
   the dose, and give them the escalation route.
2. NEVER state or imply that a photograph, a symptom, or anything you have been
   told determines whether the procedure goes ahead. That decision belongs to
   the clinical team.
3. NEVER diagnose, and never contradict the patient's appointment letter or
   their hospital/clinic's written instructions. Where you disagree with something
   they report being told, defer to the letter and suggest they call.

How to answer:

- Short. Two or three sentences. The reader is tired, possibly in a bathroom,
  and may be 70 years old.
- Plain words. No clinical vocabulary unless you immediately explain it.
- Answer in the interface language specified by the system, even if the question is in another language.
- If you are not confident, say so and give the escalation route. An invented
  answer at 1am is worse than "call this number".
- If the question involves severe pain, a hard or swollen abdomen, persistent
  vomiting, fainting, confusion, or significant fresh blood, do not triage it.
  Tell them to call the hospital/clinic now, or 995 if severe, and stop.

End with an escalation line whenever the answer is uncertain or the situation
sounds unsafe.
`.trim()

/**
 * A last-line check on the generated reply.
 *
 * Pattern matching is a crude instrument and it is not the primary control: the
 * system prompt is. It is here because the primary control is probabilistic and
 * these two failures are the ones with a clinical cost.
 *
 * Two deliberate properties, both tested in `guardrails.test.mjs`:
 *
 * **Stems, not whole words.** The version this was ported from ended each
 * alternation with `\b`, so it matched "cancel" but not "cancelled" -- which is
 * the form a model actually writes. `\w*` closes that.
 *
 * **Negation is not detected, on purpose.** "Do not take any extra preparation"
 * trips the first pattern and is replaced. That is a false positive and it is
 * the right one to accept: the replacement text says the same thing and adds
 * the escalation route, whereas teaching the matcher to skip anything near a
 * negator would let "Do not worry, take another dose" through -- a false
 * negative with a clinical cost.
 */
const FORBIDDEN: { pattern: RegExp; rule: string }[] = [
  {
    pattern:
      /\b(take|drink|have)\w*\b[^.?!]{0,60}\b(another|extra|more|second|additional|further|repeat)\w*\b[^.?!]{0,40}\b(dose|sachet|prep|preparation|bottle|solution|laxative)\w*/i,
    rule: 'no-extra-dose',
  },
  {
    pattern:
      /\b(photo|photograph|picture|image|scan)\w*\b[^.?!]{0,80}\b(cancel|postpone|reschedul|go ahead|proceed|will not|won'?t)\w*/i,
    rule: 'no-photo-verdict',
  },
]

const SAFE_FALLBACK =
  'I am not able to answer that one safely. Please call your endoscopy hospital/clinic ' +
  'on the number in your appointment letter. If you have severe pain, a hard or ' +
  'swollen tummy, cannot stop vomiting, or feel faint, call 995 now. Do not take any ' +
  'extra preparation.'

function breachedRule(reply: string): string | null {
  for (const { pattern, rule } of FORBIDDEN) if (pattern.test(reply)) return rule
  return null
}

type Turn = { role: 'patient' | 'assistant'; content: string }

export async function POST(request: Request) {
  const { tx, language } = await getI18n()
  const session = await readSession()
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const turns = (body as { turns?: unknown })?.turns
  if (!Array.isArray(turns) || turns.length === 0) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const patient = await findPatient(session.phone)
  const key = process.env.OPENAI_API_KEY

  /** The question this exchange is an answer to: the patient's latest turn. */
  const question = [...(turns as Turn[])]
    .reverse()
    .find((t) => t?.role === 'patient' && typeof t.content === 'string')?.content

  /**
   * Answer, and log the exchange for the ward.
   *
   * Every reply goes through here rather than only the successful one, because
   * the replies worth auditing are precisely the refusals and the fallbacks.
   * Nothing is written for a number with no record: `web_chat_messages` is keyed
   * on a patient, and a transcript with no patient is not evidence of anything.
   *
   * `payload` is the wire format, unchanged, and `escalated` on it is what the
   * screen paints in the alert colour -- reserved for a reply that was replaced
   * or failed. The stored flag is broader: any reply that sent the patient to a
   * person counts, because "did the assistant escalate when it should have" is
   * the question the ward is asking of the transcript. Conflating the two would
   * mean either a half-empty audit or every ordinary answer painted as an alarm.
   */
  async function answer(
    payload: { reply: string; escalated?: boolean; breach?: string; unconfigured?: boolean },
    auditEscalated = Boolean(payload.escalated),
  ) {
    payload = { ...payload, reply: tx(payload.reply) }
    if (patient && question) {
      await recordExchange({
        phone: session!.phone,
        question,
        reply: payload.reply,
        escalated: auditEscalated,
        blockedRule: payload.breach ?? null,
      })
    }
    return NextResponse.json(payload)
  }

  if (!key) {
    // No key configured: say so plainly rather than inventing an answer, and
    // still give the escalation route, which is the useful half of any reply.
    return answer({
      reply: [
        tx('The assistant is not switched on in this build, so I cannot answer that here.'),
        patient?.procedure.departmentPhone
          ? tx('Please call your endoscopy hospital/clinic on {0}.', { 0: patient.procedure.departmentPhone })
          : tx('Please call your endoscopy hospital/clinic on the number in your appointment letter.'),
        tx('If you have severe pain, a hard or swollen tummy, cannot stop vomiting, or feel faint, call 995 now.'),
      ].join(' '),
      unconfigured: true,
    })
  }

  /** Only what the assistant needs: no name, no phone number. */
  const context = patient
    ? `The patient's procedure is on ${patient.procedure.date} at ${patient.procedure.hospital}, ` +
      `arriving ${patient.procedure.arriveAt}. Their hospital/clinic's number is ` +
      `${patient.procedure.departmentPhone}. Use that number when you tell them to call.`
    : 'This patient has no procedure on file. Tell them to call the number in their appointment letter.'

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: 'system', content: SYSTEM_RULES },
          { role: 'system', content: context },
          { role: 'system', content: `The interface language is ${RESPONSE_LANGUAGES[language]}. Write the entire reply in this language. Preserve phone numbers and medication names.` },
          ...(turns as Turn[]).slice(-10).map((t) => ({
            role: t.role === 'patient' ? ('user' as const) : ('assistant' as const),
            content: String(t.content).slice(0, 2000),
          })),
        ],
      }),
    })

    if (!completion.ok) {
      const detail = await completion.text()
      console.error('[colonaid] openai error', completion.status, detail.slice(0, 500))
      return answer({ reply: SAFE_FALLBACK, escalated: true })
    }

    const data = await completion.json()
    const reply: string = data?.choices?.[0]?.message?.content?.trim() ?? ''
    if (!reply) return answer({ reply: SAFE_FALLBACK, escalated: true })

    const breach = breachedRule(reply)
    if (breach) {
      console.warn('[colonaid] reply replaced, breached', breach)
      return answer({ reply: SAFE_FALLBACK, escalated: true, breach })
    }

    return answer({ reply }, /\b995\b|call (your |the )?(?:department|hospital\/clinic)/i.test(reply))
  } catch (err) {
    console.error('[colonaid] ask failed', err)
    return answer({ reply: SAFE_FALLBACK, escalated: true })
  }
}
