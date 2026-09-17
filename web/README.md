# Clarity — web

A patient scans a QR code on their appointment letter, signs in with their
mobile number and a one-time code, and sees their colonoscopy preparation: when
the appointment is, which stage they are in, what to do today, and how the prep
is going.

Mobile-web first. It is meant to be opened in a phone browser, once, from a
printed square — so there is no install, no account to create, and no password.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

With no Twilio credentials set it runs in **demo mode**: no SMS is sent, and the
6-digit code is printed to the server console. Three demo patients exist, each
at a different point in the run-up — the boundaries are where a date-derived
plan breaks, so they are what you want to look at:

| Number      | Patient      | Where they are                   |
| ----------- | ------------ | -------------------------------- |
| `9123 4567` | Tan Wei Ming | Waiting — procedure over a year out |
| `9876 5432` | Siti Rahman  | Mid diet days                    |
| `9000 1111` | Lim Ah Kow   | Purge night, second dose pending |

Any other number signs in successfully and is told nothing is booked against it.
That is deliberate — see *Not leaking bookings* below.

## Configuration

Copy `.env.example` to `.env.local`.

| Variable                     | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `SESSION_SECRET`             | Signs the session and cooldown cookies. **Required in production.** `openssl rand -base64 32` |
| `TWILIO_ACCOUNT_SID`         | Twilio account                                        |
| `TWILIO_AUTH_TOKEN`          | Twilio auth token                                     |
| `TWILIO_VERIFY_SERVICE_SID`  | A Twilio **Verify** service (`VA…`)                   |
| `OTP_RESEND_SECONDS`         | Resend cooldown. Defaults to 60.                      |
| `OPENAI_API_KEY`             | The Ask assistant. Without it Ask says so and gives the escalation route. |
| `OPENAI_MODEL`               | Defaults to `gpt-4o-mini`. Pick for latency — this runs at 1am. |
| `NEXT_PUBLIC_SITE_URL`       | Public origin; the QR code at `/qr` points here.      |

Production refuses to start the sign-in flow without Twilio configured, rather
than silently falling back to demo mode and accepting any code.

## Structure

```
src/
  domain/      the clinical model -- dates, phases, steps, the four signals
  lib/         phone, otp, session, patient lookup   (server only)
  components/  the interface kit
  app/         routes
```

`src/domain` is ported from the Expo app in the repo root (`..`) and is plain TypeScript
with no framework imports — it is the part worth keeping.

### Brand and visual language

The Clarity mark and wordmark are **ported geometry, not a redraw**: the same 120
grid and the same 13 strokes as `../src/views/components/AppLogo.tsx` and
`Wordmark.tsx`, copied into `components/brand.tsx`. If the mark changes there,
regenerate here rather than nudging it by eye.

Icons are [Lucide](https://lucide.dev) (ISC), ported from the Expo app's set
into `components/Icon.tsx` as inline SVG rather than pulled in as a dependency —
so both apps draw the same shapes, and the glyphs tint and scale like type. Every
icon is a 24×24 grid and **the stroke scales inversely with size**, so a 40px
icon does not read heavier than a 16px one: the usual giveaway that icons were
resized rather than designed.

Everything else follows the CW12 deck: hairlines instead of boxes, solid colour
blocks with mono type reversed out of them, flat rules instead of pills, and no
shadows. Rounded tinted badges and smooth progress bars were removed for that
reason — they made a clinical signal look like a growth metric.

Two colour rules are load-bearing:

- **Green, amber and red mean prep readiness only.** They live in
  `components/signal.tsx` and nowhere else. The timeline is monochrome plus the
  single blue precisely so that when a colour does appear, it is the flag.
- **In the step list, amber is the diet and blue is the purgative** — the deck's
  split, not a severity scale. Diet decides the experience, the purgative decides
  the outcome.

#### The hospital marks are licensed artwork, and are not cleared

`public/brand/sgh.png` and `singhealth.png` were copied from the Expo app. They
are **derived from official colour artwork, not issued by either brand team**,
and the originals came from English Wikipedia, where they are hosted as
*non-free* files under a fair-use rationale that does not extend to an app.
`public/brand/README.md` carries the full note. Before this goes in front of a
patient: get the official reversed lockups from both brand teams, and get
permission in writing.

They are also the **reversed** variant — the type is white, with no dark pixels
at all — which is why `InstitutionLockup` renders them on a dark panel. That is
not a style choice; on light paper they would be invisible. Re-deriving a light
variant means generating another modification of someone else's trademark, so it
is deliberately not done here.

`cluster` defaults to `false`: the SGH file is the *endorsed* lockup and already
carries "SingHealth" under a rule, so showing the corporate logo beneath it
states the cluster twice. Pass `cluster` to show both.

### Where things are decided

- **`lib/patients.ts` is the only place a patient record comes from.** Swapping
  the demo cohort for the hospital's own system is a change in that one file.
  Screens never reach for a database.
- **The plan is derived from the procedure date, never stored against it.**
  Patients get rescheduled, and a stored plan would leave them following the old
  one.
- **Green, amber and red mean prep readiness and nothing else.** Ordinary
  interface states use ink and blue; a safety stop uses a plum that cannot be
  mistaken for a red flag.

## Recording progress

Two screens write. `/doses` takes the purgative, `/progress` takes the other
three signals — and between them the patient can now move every input behind the
flag their nurse reads in the morning. One button, one glass — `GLASS_ML`, the unit they actually pour,
not a slider, because at 1am the answerable question is "how many glasses have I
got through". It **clamps at the prescribed volume**: a counter that runs on to
1250 of 1000ml is quietly telling the patient that was fine.

### The other three, on `/progress`

| Signal | Asked as | Derivation |
| --- | --- | --- |
| Fluids | glasses, against a target of 8 | `glasses / 8`, capped at 1 |
| Bowel output | the department's own 1–5 scale | `(point − 1) / 4` |
| Diet | Stuck to it / Mostly / Slipped, per day | mean of the days answered |

Each is asked in the smallest unit a patient can answer without arithmetic. The
bowel scale is the **hospital's** scale rather than an invented one, so a patient
told "you want 4 or above" can check that claim against the same words the
department uses; its swatches are the clarity ramp off the CW12 deck's cover.
Recording a point raises a flag and says so on the same screen — it does not
decide whether the scope goes ahead, which is `NEVER[1]`.

Prep timing is the odd one out: it is *measured* from dose volume rather than
self-reported, which is why it lives in `lib/progress.ts` and the other three
derive in `domain/progress.ts:signalsFromInput`.

All four feed the flag. That link is the point — a tracker that did not move the
summary the nurse sees would be a to-do list. `lib/patients.ts:livePatient`
merges the department's fixture with the patient's own record in one place, so
no two screens can disagree. A signal left alone keeps the fixture's value and
stays `UNMEASURED` rather than becoming a zero.

Progress lives in a signed cookie (`lib/progress.ts`), same reasoning as the OTP
cooldown: no database yet, and module state does not survive a cold start or
reach a second instance. It is per-device, which is wrong for a ward and fine for
a prototype — that module is the one seam to move.

## The assistant

`/ask` is ported from the Expo app's `supabase/functions/chat`, **including its
two guarantees**, and stays on OpenAI so both apps answer the same way.

The system prompt is not an enforcement mechanism — it is a strong suggestion to
a model that can be argued with. So the two rules in `domain/progress.ts` are
checked again after generation and a breaching reply is replaced, not sent.
`npm run test:guardrails` asserts that, and it caught two real bugs in the
ported matcher:

- It ended each alternation with `\b`, so it matched "cancel" but not
  "cancelled" — the form a model actually writes. Now matched on stems.
- "Do not take any extra preparation" trips the no-extra-dose pattern and is
  replaced. That false positive is kept deliberately: the replacement says the
  same thing and adds the escalation route, whereas skipping anything near a
  negator would let "Do not worry, take another dose" through.

Conversation history is component state only. It is not persisted — writing a
medical conversation into a cookie would put it on disk on a shared family phone.

## Auth

Phone number → Twilio Verify sends a 6-digit code → a signed, `httpOnly` session
cookie holding only the verified number. Nothing clinical is in the token; the
record is fetched server-side on every request, so a stolen cookie exposes a
phone number rather than a medical history.

Twilio **Verify** is used rather than raw SMS deliberately: it owns code
generation, expiry, attempt limits and replay — the parts of an OTP flow that
are easy to get subtly wrong.

### Not leaking bookings

`/api/otp/start` answers identically whether or not the number belongs to a
patient, and a correct code always opens a session. Rejecting unknown numbers
would turn sign-in into a way to ask whether a given mobile number has a
colonoscopy booked, which is a medical fact about a named person. Unknown
numbers get in and are shown an empty plan.

### Known limitation: the resend cooldown is per device

The 1-per-minute limit is enforced with a signed cookie, so it survives a cold
start or a different serverless instance — but clearing cookies asks for another
code. Twilio Verify's own per-number limits are the backstop against someone
deliberately hammering a number.

A true per-number limit needs shared storage. `checkCooldown` in `lib/otp.ts` is
the only function that changes when a database exists; nothing else does.

## What is not built

Carried over from the Expo app but not yet ported: the meal-photograph check,
the stool-scale reading, and onboarding.

All four signals behind the flag are now writable. What is still missing is the
*automatic* half of two of them: the meal photograph check and the stool
photograph reading, which in the Expo app inferred diet compliance and bowel
output from a picture. Here both are self-reported instead, which is honest but
asks more of the patient.

Steps in the plan still cannot be ticked off — `toggleStep` exists in
`lib/progress.ts` with no UI on it. Fluids are recorded as a single running
count rather than per day, so the figure is "today" only in name.
