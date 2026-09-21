# Colonaid: colonoscopy preparation

Scaffold for the CW12 / HackitRX 2026 colonoscopy-preparation app. Built to the
brief in `../cw12-deck.html`, on the conventions of the Catholic+ codebase
(`~/Desktop/Catholic+`): Expo Router, a closed design-token set, one shared UI
kit, and motion primitives that every screen borrows its rhythm from.

**"Colonaid" survives a rename** with a find of `colonaid`.

```bash
npm install
npx expo start          # then i / a, or w for the browser
npm run typecheck
```

## Two apps in this repo

| Path  | What it is |
|-------|------------|
| `.`   | The Expo app — iOS, Android, and Expo web. The commands above. |
| `web/`| A mobile-web patient app in Next.js: QR code, sign-in by mobile number and a one-time code, then the prep plan. See `web/README.md`. |

`web/src/domain` is a port of this app's date-derived plan logic, kept as plain
TypeScript so both apps derive a plan the same way.

## What the deck asked for, and where it lives

The deck describes nine features in four parts. The parts are the four tabs.

| # | Feature | Where |
|---|---------|-------|
| 01 | An app rather than a better leaflet | the whole thing; plan derived from the date, never stored |
| 02 | Multilingual, caregiver-readable | `Language` and `Reader` on `Profile`; see the label-width note in `app/(tabs)/_layout.tsx` |
| 03 | Diet plan from the patient's own profile | `app/(tabs)/diet.tsx` |
| 04 | Photograph a meal, get a verdict | `app/check/meal.tsx` |
| 05 | 24/7 chatbot | `app/(tabs)/ask.tsx` |
| 06 | Alerts for the purgative | `app/(tabs)/prep.tsx` |
| 07 | Photograph the stool, against the hospital's scale | `app/check/stool.tsx` |
| 08 | Visible disclaimer and a route to a person | `app/safety.tsx`, `NEVER` in `src/features/flag/rules.ts` |
| 09 | One green/amber/red flag for the nurse | `app/flag.tsx`, `computeFlag` |

## The two things it will never do

They are in code, in `src/features/flag/rules.ts`, as an exported list rather
than in a document, so the screens that could plausibly break them can render
them verbatim and a test can assert no suggested action ever matches one.

1. Never tell a patient to take more purgative.
2. Never let a photograph alone decide whether a scope goes ahead.

## Built out, versus scaffolded

**Fully built**: the two pieces asked for, plus what they rest on:

- **The onboarding tour** (`views/screens/OnboardingScreen` + `views/components/`).
  A title page whose name is written letter by letter (`Wordmark`: real Dancing
  Script outlines baked to absolute SVG paths, so the cursive joins survive a
  per-letter animation that `<Text>` would break), then five slides, three parallax layers, and five animated SVG scenes: a plated
  meal under a camera frame, a night sky with an answer arriving, a glass
  filling against a progress ring, a summary card assembling itself, a shield
  with the two things the app refuses to do. Each is built from filled forms
  with gradients and cast shadows, and assembles piece by piece on a spring
  before settling into a slow ambient loop. The art scales to the screen
  (`artSizeFor`), every hook checks `useReducedMotion()`, and every gradient id
  is namespaced per scene because all five mount at once. Slide five is the
  guardrails, and Skip goes *to* it rather than past it.
- **The picture carousel** (`src/components/prep-carousel.tsx`). Six photo
  cards that rotate automatically every 6s, snap-paged with the next one
  peeking, parallax on the image inside each card, scaled-back neighbours,
  widening dots. The loop is seamless: leading cards are repeated after the
  last, and the offset is moved back a full set the moment it settles on a
  repeat, between two frames that are pixel-identical. Autoplay stops on touch
  (resuming after 9s), when the tab loses focus, and entirely under reduced
  motion.
- **The tab bar** is the platform's own (`NativeTabs`), so iOS 26 gives it
  Liquid Glass and the minimise-on-scroll morph for free, and Android gets a
  Material 3 bar.
- The theme, the UI kit, the domain types, the schedule, and `computeFlag`.

**Scaffolded**: real structure and real shapes, fixture data:

- Every hook in `src/features/prep/hooks.ts` resolves a fixture. Query keys and
  loading semantics are the real ones, so each becomes a `fetch` one line at a
  time.
- No camera. `expo-camera` is installed and the permission strings are in
  `app.json`; both check screens have the viewfinder stubbed and the result
  rendering built.
- No notifications scheduled, no auth, no backend.

## Notes worth reading before changing things

- **Green, amber and red are reserved for the prep flag.** They live under
  `flag` in the theme, not under `colors`. If they become the general-purpose
  success/warning/error palette, feature 09 stops being a signal. Ordinary
  states use ink and the one blue; a safety stop uses `alert`, a plum.
- **The prep-night screen is light, like the rest.** It was dark, on the
  argument that it is read in an unlit bathroom between 6pm and 2am. That was
  changed at the project owner's direction; the `night` tokens are still in the
  theme, so reinstating it is a palette swap in one screen.
- **Navigation uses the platform's own header.** Pushed screens get the real
  system back control, not a facsimile. That is also why nothing is presented
  as a modal: a modal has no back button on either platform.
- **Body text is 17pt and the touch target is 48.** The median user is over 50
  and preparing alone. There is no serif in the app for the same reason.
- **The native tab bar truncates labels; it does not wrap them.** That cost
  lands on feature 02: check all four languages at the largest Dynamic Type
  setting once the labels are localised, and shorten the `Label` rather than
  the screen heading if one clips.
- **`UNMEASURED` is not zero.** A patient who never opened the app has not
  failed their prep. Missing signals are dropped from the weighted mean and
  named, so the nurse sees "timing not recorded" rather than a red flag built
  out of silence.
- **The photographs need their rights settled before release.** See
  `assets/carousel/SOURCES.md`: they were retrieved from HealthHub, which is
  the publisher, not necessarily the copyright holder.

## Architecture

Model–View–Controller, with the caveat that React is not an MVC framework and
pretending otherwise buys ceremony rather than structure. What the split
actually buys here is testability: every controller can be exercised with a fake
repository and no renderer, and every view can be rendered from a literal
object. That is the test of whether a file is in the right layer.

```
app/                          ROUTES (one re-export each, nothing else
  _layout.tsx                 app bootstrap: fonts, query client, gate
  (tabs)/_layout.tsx          navigation config

src/models/                   MODEL) data and domain logic. No React.
  prep/prep.types.ts          the domain, in one file
  prep/prep.schedule.ts       the plan, derived from the procedure date
  prep/prep.repository.ts     Supabase reads/writes, fixture fallback
  prep/checks.repository.ts   meal + stool verdicts (never images)
  prep/prep.fixtures.ts       the demo patient
  flag/flag.rules.ts          NEVER, weights, computeFlag
  chat/chat.repository.ts     calls the Edge Function (never OpenAI directly
  onboarding/onboarding.model.ts

src/controllers/              CONTROLLER) hooks. React, but no layout.
  useTodayController.ts       …one per screen; see controllers/README.md

src/views/                    VIEW: rendering only. No repositories.
  screens/*.tsx
  components/ui/*             the kit
  components/icons/           Lucide line icons, as components
  components/PrepCarousel.tsx
  components/onboarding/illustrations.tsx

src/lib/                      env, query client, Supabase client
src/theme/                    the closed token set
supabase/                     migrations + the chat Edge Function
```

The two rules that keep it honest: **a view never imports a repository**, and
**a controller never imports from `views/`**. Either one appearing is the signal
that a layer is missing.

## The visual language

The kit is deliberately more than `Card`. An early pass had one (a white
rounded rectangle with an overline) and every screen became a stack of it, at
which point weight stopped meaning anything: a dose due at 6pm and a footnote
about disclaimers were drawn identically. The components below exist so that
importance can be expressed structurally rather than by heading text.

| Component | For | Used by |
|---|---|---|
| `Hero` | the one thing you look at first; inverted, at most one per screen | Today |
| `PhaseStrip` | where you are across the whole run-up, said in colour *and* in words | Today |
| `PrepCalendar` | which day is which, colour-coded by phase | Calendar |
| `AppLogo` / `Wordmark` | the mark and the written name | Onboarding, app icon |
| `Timeline` / `TimelineRow` | a *sequence*, with a connecting rail | Today, Prep night |
| `ProgressRing` | the single number that owns a screen; animates to its new value | Prep night |
| `Meter` | a value being compared against others; animates to its new value | Today, Prep night, Flag |
| `TabRow` | one panel instead of N identical cards | Diet |
| `Chip` / `ChipBed` | scannable lists; `struck` for "leave out" | Diet |
| `Notice` | present but not competing: the route to a person | Today, Diet |
| `Card` | still fine, for actual cards | the rest |

`Meter` and `ProgressRing` travel to a new value over ~520ms rather than
snapping, which is longer than the app's `motion.base` on purpose: on the purge
night the *change* is the information, and a patient recording a glass needs to
see that it counted. A 220ms tick reads as the number being different; half a
second reads as the number moving.

The five phases have their own palette, `phaseRamp`, shared by the strip and
the calendar so a patient who taps through finds the same key rather than a
second one to learn. It started as a single-hue ramp deepening toward the
procedure: elegant, and useless: four shades of blue at swatch size are four
shades of blue. It is now four separate hues, cyan → violet → indigo → blue.
All four are cool, which is a constraint rather than a taste: warm hues sit near
the flag's amber, and a *date* must never be readable as a *warning*.

Two rules the kit is built around. **Green, amber and red belong to the prep
flag** and nothing else, so allowed/avoid on the diet screen is carried by icon
and strikethrough rather than by hue, which is also what makes it survive a
colour vision deficiency. And **`categorical` tints distinguish, they do not
rank**: the produce group is a blue teal rather than the obvious green, and
protein a clay brown rather than red, so a food group can never be misread as a
readiness signal. `signalTones` does the same job for the four measures behind
the flag (timing, output, diet, fluids) which as four identical blue bars read
as one four-part quantity rather than four things that can each be fine or not.

Icons are [Lucide](https://lucide.dev) (ISC), converted to `react-native-svg`
components at build time in `views/components/icons`. They sit alongside
Ionicons rather than replacing it: Ionicons carries interface furniture, Lucide
has the vocabulary (wheat, a fish, a glass of water) that lets four food
groups be told apart at a glance.

## Backend

### Where the keys go, and why

| Credential | Lives | Why |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY` | `.env`, bundled into the app | The anon key is not an authorisation. Every request it makes is still evaluated against Row Level Security using the caller's JWT, so a stolen copy grants what an anonymous visitor already has. |
| `OPENAI_API_KEY` | Edge Function secrets **only** | It *is* an authorisation: to spend, unscoped. An Expo bundle is readable with `strings`; a key shipped in one is someone else's free account within days. |
| `SUPABASE_SERVICE_ROLE_KEY` | Injected into Edge Functions automatically | Bypasses RLS entirely. Never set it yourself, never prefix it `EXPO_PUBLIC_`. |

If either secret ever lands in a commit, rotate it. Deleting the commit is not
enough: assume anything pushed has been scraped.

### Setup

```bash
cp .env.example .env                 # fill in the Supabase URL + anon key
npm run db:start                     # local Supabase
npm run db:reset                     # applies supabase/migrations/0001_init.sql
npm run db:types                     # replaces the hand-written database.types.ts

supabase secrets set OPENAI_API_KEY=sk-...
npm run fn:deploy                    # deploys the chat function
```

Locally, `npm run fn:serve` reads the key from `supabase/functions/.env`
(gitignored; see `.env.example` beside it).

**With no Supabase project at all, the app still runs.** Every repository falls
back to the demo patient in `prep.fixtures.ts`, and the chat says so plainly
rather than pretending to think. That is what keeps a fresh clone demoable.

### What the chat function guarantees

The two rules in `flag.rules.ts` are in its system prompt *and* re-checked
against the generated reply. A system prompt is a strong suggestion to a model
that can be argued with; the post-check is the enforcement. A reply that appears
to authorise a second dose, or to let a photograph decide whether the scope goes
ahead, is replaced with the escalation message. That will occasionally fire on
an innocent answer: the cost is one unhelpful reply and a phone number, which
is the cheap direction to fail in.

Both sides of every exchange are written by the function under the service role,
and the client's RLS policy on `chat_messages` is select-only, so a patient
cannot forge an assistant message that appears to authorise something.

## Data protection

`supabase/migrations/0001_init.sql` enforces two things the copy promises:

- **RLS on every table**, keyed on `auth.uid()`. There is no read-all role.
- **No photograph is ever stored.** The meal and stool tables have no image
  column, no bucket reference, no URL: only a verdict, a confidence and a
  timestamp. The app tells patients the photo stays with them; the schema is
  what makes that true.

