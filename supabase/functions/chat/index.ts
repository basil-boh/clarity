// ═══════════════════════════════════════════════════════════════════════════
// chat · the 24/7 assistant (feature 05)
// ═══════════════════════════════════════════════════════════════════════════
//
// This function exists for one reason: **the OpenAI key must never reach the
// device.** An Expo bundle is readable by anyone holding the app, and an OpenAI
// key is an authorisation to spend, with no per-user scoping. So the device
// sends a question and its Supabase JWT; this function holds the key, builds
// the clinical context server-side, calls the model, and returns text.
//
// Deploy:
//   supabase secrets set OPENAI_API_KEY=sk-...
//   supabase functions deploy chat
//
// The key is set through `secrets set`, never committed, and never added to
// `.env`: that file is bundled.
//
// ── What this function guarantees ──────────────────────────────────────────
//
// The two rules in `models/flag/flag.rules.ts` are product promises, and a
// system prompt is not an enforcement mechanism: it is a strong suggestion to
// a model that can be argued with. So both are checked again after generation,
// and a reply that appears to breach either is replaced rather than sent. That
// is deliberately blunt: a false positive costs a patient one unhelpful answer
// and a phone number, which is the cheap direction to fail in.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
// Configurable so the model can be changed without a code deploy. Any
// OpenAI chat-completions model works; pick for latency, this runs at 1am.
const OPENAI_MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** What the assistant is told it must never do, in its own words. */
const SYSTEM_RULES = `
You are the overnight assistant inside a colonoscopy-preparation app used in
Singapore. You are talking to a patient, or to the family member preparing them,
usually between 6pm and 2am when no hospital department can be reached.

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
   their department's written instructions. Where you disagree with something
   they report being told, defer to the letter and suggest they call.

How to answer:

- Short. Two or three sentences. The reader is tired, possibly in a bathroom,
  and may be 70 years old.
- Plain words. No clinical vocabulary unless you immediately explain it.
- Answer in the language the patient wrote in.
- If you are not confident, say so and give the escalation route. An invented
  answer at 1am is worse than "call this number".
- If the question involves severe pain, a hard or swollen abdomen, persistent
  vomiting, fainting, confusion, or significant fresh blood, do not triage it.
  Tell them to call the department now, or 995 if severe, and stop.

End with an escalation line whenever the answer is uncertain or the situation
sounds unsafe.
`.trim();

/**
 * A last-line check on the generated reply.
 *
 * Pattern matching is a crude instrument and it is not the primary control:
 * the system prompt is. It is here because the primary control is probabilistic
 * and these two failures are the ones with a clinical cost.
 */
const FORBIDDEN: { pattern: RegExp; rule: string }[] = [
  {
    pattern:
      /\b(take|drink|have)\b[^.?!]{0,60}\b(another|extra|more|second|additional|further|repeat)\b[^.?!]{0,40}\b(dose|sachet|prep|preparation|bottle|solution|laxative)\b/i,
    rule: 'no-extra-dose',
  },
  {
    pattern:
      /\b(photo|photograph|picture|image|scan)\b[^.?!]{0,80}\b(cancel|postpone|reschedul|go ahead|proceed|will not|won't)\b/i,
    rule: 'no-photo-verdict',
  },
];

const SAFE_FALLBACK =
  'I am not able to answer that one safely. Please call your endoscopy department ' +
  'on the number in your appointment letter. If you have severe pain, a hard or ' +
  'swollen tummy, cannot stop vomiting, or feel faint, call 995 now. Do not take any ' +
  'extra preparation.';

function breachedRule(reply: string): string | null {
  for (const { pattern, rule } of FORBIDDEN) {
    if (pattern.test(reply)) return rule;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    if (!OPENAI_API_KEY) {
      // Configuration error, not a user error: say so rather than pretending
      // the assistant is thinking.
      return json({ error: 'OPENAI_API_KEY is not set on this function.' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header.' }, 401);

    // The caller's own client, so RLS applies to the context we read. Using the
    // service role here would let a crafted request pull another patient's plan
    // into the prompt.
    const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: auth } = await asUser.auth.getUser();
    const user = auth?.user;
    if (!user) return json({ error: 'Not signed in.' }, 401);

    const { question } = (await req.json()) as { question?: unknown };
    if (typeof question !== 'string' || question.trim().length === 0) {
      return json({ error: 'A question is required.' }, 400);
    }
    if (question.length > 2000) return json({ error: 'Question is too long.' }, 400);

    // ── context, read under the patient's own permissions ──────────────────
    const [{ data: profile }, { data: procedure }] = await Promise.all([
      asUser.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      asUser
        .from('procedures')
        .select('*')
        .eq('patient_id', user.id)
        .order('scheduled_for', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const context = [
      profile?.language ? `Patient's language: ${profile.language}.` : null,
      profile?.year_of_birth ? `Born ${profile.year_of_birth}.` : null,
      profile?.conditions?.length ? `Conditions: ${profile.conditions.join(', ')}.` : null,
      profile?.allergies?.length ? `Allergies: ${profile.allergies.join(', ')}.` : null,
      profile?.dietary_preferences?.length
        ? `Dietary: ${profile.dietary_preferences.join(', ')}.`
        : null,
      procedure?.scheduled_for ? `Procedure date: ${procedure.scheduled_for}.` : null,
      procedure?.department_phone
        ? `Department phone: ${procedure.department_phone}.`
        : 'Department phone: the number on the appointment letter.',
    ]
      .filter(Boolean)
      .join(' ');

    // ── the model call ─────────────────────────────────────────────────────
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: 'system', content: SYSTEM_RULES },
          { role: 'system', content: `Context about this patient: ${context}` },
          { role: 'user', content: question },
        ],
      }),
    });

    if (!completion.ok) {
      const detail = await completion.text();
      console.error('openai error', completion.status, detail.slice(0, 500));
      return json({ error: 'The assistant is unavailable right now.' }, 502);
    }

    const payload = await completion.json();
    let reply: string = payload.choices?.[0]?.message?.content?.trim() ?? '';
    if (!reply) reply = SAFE_FALLBACK;

    const breach = breachedRule(reply);
    if (breach) {
      console.warn('blocked reply', { rule: breach, userId: user.id });
      reply = SAFE_FALLBACK;
    }

    const escalated = Boolean(breach) || /\b995\b|call (your |the)?department/i.test(reply);

    // Both sides are written under the service role so the client cannot forge
    // an assistant message. RLS on `chat_messages` is select-only for patients.
    const asService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    await asService.from('chat_messages').insert([
      { patient_id: user.id, role: 'patient', content: question },
      { patient_id: user.id, role: 'assistant', content: reply, escalated },
    ]);

    return json({ reply, escalated, blocked: breach });
  } catch (error) {
    console.error('chat function failed', error);
    return json({ error: 'Something went wrong.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
