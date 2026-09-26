# Colonaid — web

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

With nothing configured it runs entirely on fixtures: no SMS is sent, the
6-digit code is printed to the server console, patient records come from an
in-memory cohort, and what the patient records is kept in a signed cookie.
Setting Twilio and Supabase replaces those three one at a time — see
*Configuration* and *The database* below.

Three demo patients exist, each at a different point in the run-up — the
boundaries are where a date-derived plan breaks, so they are what you want to
look at:

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
| `SUPABASE_URL`               | Project URL. Blank runs on the demo fixture.          |
| `SUPABASE_SERVICE_ROLE_KEY`  | **Bypasses RLS entirely.** Server-only, never `NEXT_PUBLIC_`. See *The database*. |
| `PATIENT_SOURCE`             | `demo` or `supabase`. Blank follows whether the two above are set. |
| `TWILIO_ACCOUNT_SID`         | Twilio account                                        |
| `TWILIO_AUTH_TOKEN`          | Twilio auth token                                     |
| `TWILIO_VERIFY_SERVICE_SID`  | A Twilio **Verify** service (`VA…`)                   |
| `OTP_RESEND_SECONDS`         | Resend cooldown. Defaults to 60.                      |
| `DEMO_PHONES`                | Numbers that skip Twilio and show their code on screen. Public — fictional numbers only. |
| `ALLOW_DEMO_PHONES_IN_PRODUCTION` | `true` lets `DEMO_PHONES` work in production, for a hosted prototype. |
| `OPENAI_API_KEY`             | The Ask assistant. Without it Ask says so and gives the escalation route. |
| `OPENAI_MODEL`               | Defaults to `gpt-4o-mini`. Pick for latency — this runs at 1am. |
| `NEXT_PUBLIC_SITE_URL`       | Public origin; the QR code at `/qr` points here.      |

Production refuses to start the sign-in flow without Twilio configured, rather
than silently falling back to demo mode and accepting any code. It refuses to
start at all without a patient source, for the same reason: three fictional
Singaporeans served to a real patient is worse than an error page.

## The database

Paste `supabase/migrations/0001_web_portal.sql` into the project's SQL editor
and run it once. It is schema *and* demo cohort in one transaction, so it is one
paste rather than two, and it is safe to re-run: the schema uses `if not exists`
throughout and the cohort is upserted, so running it again repairs a
half-applied state and puts the three demo patients back on their date
boundaries.

Then `supabase/migrations/0002_medications_and_fluid_days.sql`, the same way.
It adds `web_progress.fluid_days` (clear fluid per day) and `web_medications`
(left from the retired medication-photo feature; nothing reads or writes it
now), and is also safe to re-run. Until it has run the app keeps working on the old
behaviour and logs which file to apply.

Then `supabase/migrations/0003_questionnaire.sql`, for the first-sign-in
questions below. Until it has run, nobody is asked and the Diet page shows the
standard lists.

### The first-sign-in questions

The first time a booked patient signs in, `/welcome` asks four things: age
range, gender, ethnicity, and whether they eat halal, vegetarian, vegan, no pork
or no beef. Every question has "Prefer not to say", and the whole page can be
skipped — the prep instructions are what they came for, and nothing stands in
front of them. Answers are kept in `web_questionnaire` and can be changed from
the Diet page at any time.

Only diet and ethnicity change what is shown, in `domain/diet.ts:dietFor`:

- **Diet** removes what it rules out — no pork for halal, no meat or fish for
  vegetarian, no eggs or dairy either for vegan — and says so at the top of the
  page.
- **Ethnicity** adds everyday Chinese, Malay or Indian food to both sides of the
  list: plain bubur nasi or fish soup bee hoon to eat; chapati, dhal or bandung
  to leave out this week.

Nothing added is a new rule. Each "yes" is an allowed food in a local dish and
each "not this week" is an existing rule — whole grains, beans and lentils,
seeds, raw or leafy vegetables, red or purple — applied to one; `test:diet`
checks that no answer ever moves a food the standard list avoids onto the
allowed side. Age and gender are kept for the department and change nothing on
screen, because there is no basis for a different low-residue diet by either.
As with the rest of the diet, this is scaffold content for the department to
check, not clinical guidance.

Staff see the answers on the patient's page in `/admin`. "Clear recorded
progress" clears them too, so a demo number is asked again at its next sign-in.

`../supabase/migrations/0001_init.sql` is the **Expo app's** schema and is left
alone. Every table there is keyed on `auth.users` and every policy on
`auth.uid()`, because the device holds a Supabase JWT. This app does not — a
patient proves they hold a mobile number via Twilio Verify and gets a signed
cookie from the Next.js server, so there is no Supabase user for a policy to key
on. Merging the two would mean one of them lying about who a row belongs to. The
`web_` prefix says which app owns a row.

`supabase/seed_local.sql` is gitignored and optional: it adds one more patient
for a real mobile number. On a Twilio **trial** account an SMS only reaches a
number verified in the Twilio console, so the fictional demo numbers can be
typed into the sign-in form but the code never arrives. Testing the real SMS
path means making the verified number a patient.

### Adding patients from `/admin`

Set `ADMIN_PASSWORD` and open `/admin`. It lists every patient with their
procedure date and the phase they are in today, and adds, edits and deletes
them. Each patient's page shows everything held for them — booking and stage,
the readiness flag and its four signals, what they recorded, their assistant chat and sign-in codes — with
editing one step away behind **Edit details**. The stage shortcuts on the form set the date so the patient lands in a
given phase — the purge night, say — which is the quickest way to see a screen
at a boundary. "Clear recorded progress" wipes what a patient logged and keeps
their booking, for running the same number through again.

With `ADMIN_PASSWORD` unset every `/admin` route is a 404. It is one shared
password, not staff accounts; the cookie it sets is separate from the patient
session, scoped to `/admin`, and invalidated by changing the password. The
admin reads the whole ward, so it uses the service role client directly rather
than `patientScope()` — `requireAdmin()` in `src/lib/admin.ts` is what stands in
front of every page and server action there instead.

### Where the authorisation actually is

Since RLS cannot do it, the boundary moves rather than disappearing:

- The `web_*` tables have RLS **enabled with no policies**, which in Postgres
  means deny, and `anon`/`authenticated` are revoked on top. Nothing reaches
  them but the service role.
- **No Supabase credential reaches the browser.** Nothing client-side imports
  `lib/supabase.ts`, `server-only` makes that a build error rather than a code
  review, and there is no `NEXT_PUBLIC_` Supabase variable to leak.
- **Every query filters by the phone number in the verified session.** That is
  now the authorisation, and it is load-bearing — a query that forgets its
  `.eq('phone', …)` returns the whole ward. `patientScope(phone).select(…)`
  exists so the filter is applied by construction rather than remembered.

The cost is honest and worth stating: a leaked service role key is every
patient's record. The Expo app's anon key is not, and `.env.local` is the thing
to protect here.

### What the schema still guarantees

Both rules from `0001` carry over. **No photograph is stored** — there is no
bytea column, no bucket reference and no URL in either file. **The plan is
derived, never stored** — only the procedure date is in the table, so a
rescheduled patient is not left following the old plan.

One new constraint is worth naming: `web_doses_within_prescription` rejects any
row where `consumed_ml > prescribed_ml`. The clamp in `recordDose` is the first
line of that and the constraint is the one that cannot be bypassed — the app
must never help a patient past the prescribed volume, and the database must
never accept a row that says it did.

## Structure

```
src/
  domain/      the clinical model -- dates, phases, steps, the four signals
  lib/         phone, otp, session, patient lookup, supabase, source   (server only)
  components/  the interface kit
  app/         routes
```

`src/domain` is ported from the Expo app in the repo root (`..`) and is plain TypeScript
with no framework imports — it is the part worth keeping.

### Brand and visual language

The Colonaid mark and wordmark are **ported geometry, not a redraw**: the same 120
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

#### There are no hospital marks

There were: `public/brand/sgh.png` and `singhealth.png`, copied from the Expo
app and shown in a dark bar above the welcome form. They are gone, along with
the `InstitutionBar` and `InstitutionLockup` components that rendered them.

Two reasons, and the second is the one that mattered. They were **derived from
official colour artwork rather than issued by either brand team**, and the
originals came from English Wikipedia, where they are hosted as *non-free* files
under a fair-use rationale that does not extend to an app. And this app is not
run by SGH or SingHealth: their marks at the top of it state an endorsement that
nobody gave.

If a department does adopt this, that is the point to ask them for their own
reversed lockup and permission in writing — not to reinstate these.

Colonaid's own wordmark is unaffected; it is drawn in `components/brand.tsx` and
owes nothing to anyone.

### Where things are decided

- **`lib/patients.ts` is the only place a patient record comes from.** It now
  answers from either the demo cohort or Supabase, and that is the whole extent
  of the change — screens never reach for a database, and the next swap, to the
  hospital's own system, is the same one file.
- **`lib/supabase.ts` is the only place the service role key is held**, and the
  only place a query is built without a phone number already attached to it.
- **`lib/source.ts` is one switch, not three.** Demo or database is a single
  decision covering the patient record, what they record, and the assistant's
  transcript. Splitting it looks harmless and is not: with patients coming from
  the fixture and progress going to Postgres, the first glass a demo patient logs
  is a write against a `web_patients` row that does not exist, and the patient is
  told their prep could not be saved.
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
| Fluids | glasses per day, against a target of 8 | the latest day's `glasses / 8`, capped at 1 |
| Bowel output | the department's own 1–5 scale | `(point − 1) / 4` |
| Diet | Stuck to it / Mostly / Slipped, per day | mean of the days answered |

Each is asked in the smallest unit a patient can answer without arithmetic. The
bowel scale is the **hospital's** scale rather than an invented one, so a patient
told "you want 4 or above" can check that claim against the same words the
department uses; its swatches are the clarity ramp off the CW12 deck's cover.
Recording a point raises a flag and says so on the same screen — it does not
decide whether the scope goes ahead, which is `NEVER[1]`.

Fluid is counted per Singapore date, so the "today" counter starts again at
zero each day. The flag reads the most recent day anything was recorded — on
procedure morning, before a glass is poured, that is the purge night.

"Today" is always the Singapore date, whatever zone the server runs in
(`domain/prep.ts:todayIn`). Most hosts run on UTC, eight hours behind, which
would otherwise put the whole plan a day late from midnight to 8am.

Steps are ticked off on Today and the Plan: today's and earlier ones, never a
day ahead. The Plan shows only today and the days ahead.

Prep timing is the odd one out: it is *measured* from dose volume rather than
self-reported, which is why it lives in `lib/progress.ts` and the other three
derive in `domain/progress.ts:signalsFromInput`.

All four feed the flag. That link is the point — a tracker that did not move the
summary the nurse sees would be a to-do list. `lib/patients.ts:livePatient`
merges the department's fixture with the patient's own record in one place, so
no two screens can disagree. A signal left alone keeps the fixture's value and
stays `UNMEASURED` rather than becoming a zero.

Where it is kept is `lib/progress-store.ts`; `lib/progress.ts` keeps the rules
and does not know. With Supabase configured it is a row per patient in
`web_progress` and a row per dose in `web_doses`, keyed on the verified phone
number, so it survives a new browser, a cleared cache, and the patient moving
from their phone to their daughter's laptop. Without one it falls back to the
signed cookie, which is per-device and capped at 4KB: fine for a demo, wrong for
a ward.

The two backends differ on one point deliberately. **A failed read degrades; a
failed write does not.** A read that fails shows "not recorded" for something the
patient did record, which they can see and re-enter — better than falling over on
the purge night, when the thing they came to do is log a glass. A write that
fails says so, because a tracker that says "saved" and did not is worse than one
that admits it: the patient stops counting in their head, and the ward reads a
prep that never happened.

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

Conversation history is component state only and is never sent back to the
browser: it is not restored on reload, because writing a medical conversation
into a cookie would put it on disk on a shared family phone.

It *is* written server-side, to `web_chat_messages`, and that is for the ward
rather than the patient. `escalated` is how a department finds out whether the
assistant actually told someone to call when it should have, and `blocked_rule`
records which of the two `NEVER` rules replaced a reply. A guardrail nobody can
audit is a claim, not a control. The stored flag is deliberately broader than the
one on the wire — any reply that sent the patient to a person counts, whereas the
screen paints only a replaced or failed reply in the alert colour. Conflating
them would mean either a half-empty audit or every ordinary answer painted as an
alarm.

The write is the one in this app allowed to fail quietly: a transcript is an
audit trail, and it must not cost a patient the answer they are waiting on.

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

### Demoing on a Twilio trial account

A trial account only delivers an SMS to a number verified in the Twilio console
— usually one phone, the developer's. Every other number can be typed into the
sign-in form but the code never arrives, and a correct code is the only way past
the form. So a demo runs on one number, or Twilio gets switched off entirely and
the real send path stops being exercised at all.

`DEMO_PHONES` is the way out: a comma-separated list that takes the demo path —
no SMS, and the code shown on the sign-in screen (and printed to the server
console) — while every other number still goes through Twilio for real. One
build demonstrates both halves. Demo numbers skip the resend cooldown: it exists
to limit SMS spend, nothing is sent, and a shared demo number would otherwise
make testers wait on each other.

**Every number on the list is public.** The sign-in page offers them and shows
their code to whoever types one, so list fictional demo patients only.

```
DEMO_PHONES="9123 4567, 9876 5432, 9000 1111"
```

Entries are normalised with the same function the sign-in form uses, so
`9123 4567` matches a patient who typed `+65 91234567`. An entry that cannot be
normalised is dropped with a warning rather than silently never matching.

Three things keep it from being a back door:

- **It does not exist in production unless asked for twice.** The list is
  empty when `NODE_ENV=production` unless `ALLOW_DEMO_PHONES_IN_PRODUCTION=true`
  is also set, so a deploy carrying `DEMO_PHONES` by accident is not a deploy
  with a bypass in it. The second switch is for a hosted prototype, whose
  testers have no server console and no verified Twilio number.
- **It is opt-in and explicit.** No number takes this path unless someone typed
  it into an environment variable. There is no default list.
- **The code is still a real code** — the same HMAC-derived rotating 6 digits as
  full demo mode, checked the same way. This skips the *carrier*, not the
  verification: a wrong code is still refused, so the flow being demonstrated is
  the flow that ships.

The sign-in screen says which of the three states it is in — off, `all` (no
Twilio at all), or `some` (these numbers only). Printing "Demo mode" over a build
that texts every other number for real would be a lie that costs someone an SMS
bill.

### The resend cooldown

Two limits, and only the second one really holds.

A signed cookie limits the **device**. It costs one HMAC, works with no database
at all, and stops the ordinary double-tap before a round trip — but clearing
cookies asks for another code.

A row per number in `web_otp_sends` limits the **number**, which is the one that
matters: a private window, a second phone and a cleared cache all land on the
same row. It is a *claim* rather than a question — `web_otp_claim` does the check
and the write in one statement, because reading and then writing would let two
taps a few milliseconds apart both see an expired window and both send.

Two deliberate choices in there:

- **The slot is claimed before Twilio is called**, so a Twilio failure still
  costs the patient the cooldown. A failing Twilio will fail again immediately,
  and releasing the claim would turn an outage into an unbounded retry loop
  against a paid API.
- **A database error fails open** onto the cookie. Twilio Verify's own per-number
  limits are the backstop for the abuse case; the alternative is a patient locked
  out of their prep instructions at 1am because a database blipped.

## What is not built

The meal-photograph check is not ported. Onboarding is the four questions above;
there is no walkthrough of the app itself.

### Guided stool check-in

`/readiness` and `/verify` use the same photo-free check-in. It first asks what
patients are using to judge their progress, then asks about colour, consistency
and (for watery output) whether the liquid is see-through. Brief guidance
responds to their answers: colour and frequent trips alone never confirm
readiness. Patients review and explicitly save their observations. The stool
photo component and `/api/verify` endpoint have been removed; no AI key is needed
for this check. Historical image assessments are retained for staff records.

Apply `supabase/migrations/0006_stool_check.sql` before saving check-ins with
Supabase. It adds `web_progress.stool_check` for the latest structured answers;
demo mode stores these in the existing signed progress cookie. Existing records
without this field remain readable. Missing migrations cause new check-in saves
to fail visibly rather than silently discard the observations. The existing
bowel scale is derived from consistency and clarity, never colour or frequency;
uncertain and very dark/red observations do not create a clear score.

Run `node --experimental-strip-types --test src/domain/stool-check.test.mjs` for
validation, misconception and uncertain/concerning-output cases.

Copy references: [Mayo Clinic on stool colour, foods, iron and bile](https://www.mayoclinic.org/diseases-conditions/diarrhea/expert-answers/stool-color/faq-20058080),
and [NHS bowel-preparation guidance on watery, clear output](https://www.nth.nhs.uk/resources/colonoscopy-using-klean-prep/).
The check-in does not adopt the latter’s product-specific dose instructions;
patients continue to follow their own department’s prescribed plan.

**Patients are entered one at a time.** `/admin` adds and edits them and shows
everything held for each one, but there is no import from a hospital system, and
no ward view across patients — which of tomorrow's list is amber or red, whose
assistant chat escalated — only one patient at a time.

## Dose reminders

The calendar export (`Add to calendar`) writes a `VALARM` half an hour before
each dose, so a patient's own phone alarms them offline, with no signal and no
server. It is free and it is the more reliable of the two channels — but it only
works for a patient who tapped download, and the people least likely to do that
are the people most likely to sleep through the 2am dose.

So there is a second channel that needs nothing from them on the night: a
Telegram bot messages them half an hour before each dose, in the language they
chose. Telegram rather than SMS because it costs nothing per message — an SMS
pilot is rationed by a budget, and nobody should be deciding whether tonight's
patient is worth four cents. The price is that the patient taps a link once, on
the Home page, during the run-up.

**Only the purgative is reminded about.** A reminder that also fires for
"arrange your escort" teaches a patient to ignore the one that decides the
outcome.

### Setting it up

1. Message `@BotFather` on Telegram, `/newbot`, and put the token in
   `TELEGRAM_BOT_TOKEN` and the bot's name in `TELEGRAM_BOT_USERNAME`. Without a
   username the connect card is not shown at all — an offer that leads nowhere
   is worse than no offer.
2. Apply `supabase/migrations/0004_reminders.sql`. Until it has run, nobody is
   offered the connect card and the reminder endpoint finds no recipients.
3. Point Telegram at the webhook, once per deployment URL:

   ```
   curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
     -H 'Content-Type: application/json' \
     -d '{"url":"https://YOUR-APP/api/telegram/webhook",
          "secret_token":"YOUR TELEGRAM_WEBHOOK_SECRET",
          "allowed_updates":["message"]}'
   ```

4. Schedule the run. The SQL is at the bottom of `0004_reminders.sql`: Supabase
   Cron every fifteen minutes, calling `/api/reminders/send` with
   `REMINDER_CRON_SECRET` in the `x-reminder-key` header. Supabase rather than
   Vercel Cron because the Hobby plan fires once a day and "within the hour",
   which is useless for a 01:30 send.
5. Leave `REMINDERS_ENABLED=false` and watch a purge night go past in the logs
   first. Each run logs exactly who it *would* have messaged, about which dose.
   Turn it on when the log looks right.

### Why it polls

Every fifteen minutes, not two scheduled sends at 17:30 and 01:30. A reminder
stays due from half an hour before its dose until the dose itself, so a late or
missed cron run still catches the patient — missing the 2am reminder is the
whole failure this exists to prevent. Nothing is sent *after* a dose time: a
message at 03:00 about the 02:00 dose can only tell someone they have failed, at
an hour when they can do nothing about it.

Sending twice is prevented by `web_reminders_sent`, which is claimed *before*
the message goes out — two overlapping runs would otherwise both read an empty
log and both message a patient in the middle of the night. A transient Telegram
failure releases the claim so the next run retries; a patient who has blocked
the bot is marked stopped and not retried, because that is a withdrawal of
consent rather than an error.

`npm run test:reminders` covers the timing, including that a server running on
UTC reminds at the same Singapore moment — the bug that would otherwise fire
these eight hours out.

## Meal list data

The Diet page reads `src/domain/diet-foods.ts`, a checked-in dataset originally
generated from `colonoscopy_diet_food_guide.xlsx` (`Food Guide` sheet). The workbook
is not included in the repository. Excel and Python are not needed to run, test,
or build the app. Food data can be maintained directly in the TypeScript dataset.

If you retain a workbook copy, run `npm run import:diet -- --source /path/to/file.xlsx`
from `web/`, review the generated diff, and rebuild the app. Add `--check` to verify
that the dataset matches that workbook without changing it. Importing overwrites
any direct edits to the dataset. Without `--source`, the importer looks for the
original filename at the repository root.

Run `npm run test:diet` to check all six prep-day/diet combinations. Check statuses
are hidden based on the selected diet column. Clear-liquid allowed foods also
appear on low-residue days; clear-liquid-only avoid rows do not. Low-residue-only
foods move to Avoid on clear-liquid days. Both-phase rows retain their diet status.

### Overall readiness flag

The bottom of `/readiness` uses the requested ordered product rules in
`src/domain/readiness.ts`: poor purgative or not-ready morning stool → red;
good purgative plus ready morning stool → green; otherwise amber. Diet affects
supportive copy only. This is not a numerical average or an attendance decision.
It does not replace the separate legacy staff triage score.

Full recorded volumes and on-time confirmations for every dose establish good
purgative adherence. Patients can explicitly report still completing, full prep
with late timing, or missed/stopped preparation. These reports take precedence
until the patient updates them or chooses to use the dose records again. An
unfilled log is unknown, not proof of a missed dose. The status reports reuse
reserved completed-step keys, so no additional database migration is needed.

New stool check-ins receive a server timestamp and procedure date in the existing
`stool_check` JSON. Only a check saved on the current procedure date contributes
the morning stool result. Legacy observations without timestamps remain unknown
until rechecked. Light-orange and small-particle options distinguish “almost”
from murky or solid output. Uncertain observations remain amber unless another
input triggers red; dark/blood-like output retains its separate contact-team
message. Green never tells the patient to attend, and red never tells them to
cancel or take extra purgative.

Test the matrix and input rules with
`node --experimental-strip-types --test src/domain/readiness.test.mjs`.
Contact-team and prescribed-preparation wording is consistent with
[Nottingham University Hospitals’ bowel-preparation guidance](https://www.nuh.nhs.uk/bowel-preparation);
the exact decision matrix is the requested application logic.
