-- ═══════════════════════════════════════════════════════════════════════════
-- Clarity web portal · schema and demo cohort, in one transaction
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Paste the whole file into the Supabase SQL editor and run it once:
--
--   https://supabase.com/dashboard/project/<your-ref>/sql/new
--
-- It is **safe to re-run**. The schema uses `if not exists` throughout and the
-- cohort is upserted, so running it again repairs a half-applied state and puts
-- the three demo patients back on their date boundaries rather than duplicating
-- them.
--
-- Everything is wrapped in one transaction. Postgres makes DDL transactional,
-- so a failure half way leaves the database exactly as it was -- which matters
-- when the alternative is a project with four of the six tables and an app that
-- half works.
--
-- This is the web app's schema only. The Expo app's lives at
-- `../../supabase/migrations/0001_init.sql` and is untouched: every table there
-- is keyed on `auth.users` and every policy on `auth.uid()`, because the device
-- holds a Supabase JWT. This app does not -- see the note below.

begin;

create extension if not exists "pgcrypto";

-- ── Why this schema exists separately ─────────────────────────────────────
--
-- The web portal has no Supabase JWT. A patient scans a QR code on their
-- appointment letter, proves they hold a mobile number via Twilio Verify, and
-- gets a signed `httpOnly` cookie from the Next.js server. There is no Supabase
-- user to key a policy on, so the authorisation boundary is somewhere else --
-- see `src/lib/supabase.ts`, which is the only file that holds the key.
--
-- Three rules govern everything below.
--
-- 1. **These tables are reachable by the service role and by nothing else.**
--    RLS is enabled on every one of them and *no policy is created*, which in
--    Postgres means: deny. `anon` and `authenticated` are additionally revoked
--    at the bottom, so a leaked anon key reaches nothing here. The Next.js
--    server is the only client, it holds the service role key, and it filters
--    every single query by the phone number in the verified session.
--
-- 2. **No photograph is ever stored.** Verdicts, confidences and timestamps
--    only. There is no bytea column, no storage bucket reference, no URL.
--
-- 3. **The plan is derived, never stored.** Only the procedure *date* is here.
--    Diet days, dose times and step lists are computed from it in
--    `src/domain/prep.ts`, so a rescheduled patient gets the right plan without
--    a data migration.
--
-- Table names carry a `web_` prefix so it is unambiguous which application owns
-- a row.

-- ── patients ───────────────────────────────────────────────────────────────
-- The phone number *is* the identity, normalised to E.164 once at the edge by
-- `web/src/lib/phone.ts`. Everything downstream keys off that exact string, so
-- a patient who types "9123 4567" on Monday and "+65 91234567" on Tuesday is
-- one person. The check constraint is the last line of that defence.

create table if not exists public.web_patients (
  phone         text primary key check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  display_name  text not null default '',
  language      text not null default 'en' check (language in ('en','zh','ms','ta')),
  reader        text not null default 'patient' check (reader in ('patient','caregiver')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── procedures ─────────────────────────────────────────────────────────────
-- A patient can have more than one row over time: last year's scope, and next
-- month's. The portal reads the latest by date, so a completed procedure keeps
-- showing "Afterwards" until the next one is booked.

create table if not exists public.web_procedures (
  id                uuid primary key default gen_random_uuid(),
  phone             text not null references public.web_patients on delete cascade,
  scheduled_for     date not null,
  -- Local wall-clock time. Stored as `time` rather than `timestamptz` on
  -- purpose: "arrive at 07:45" is what the letter says and what the patient
  -- reads, and it must not shift if the server's zone is wrong.
  arrive_at         time not null default '08:00',
  hospital          text not null default '',
  location          text not null default '',
  department_phone  text not null default '',
  created_at        timestamptz not null default now()
);
create index if not exists web_procedures_phone_idx
  on public.web_procedures (phone, scheduled_for desc);

-- ── doses ──────────────────────────────────────────────────────────────────
-- Finishing the full volume at the right time is the single thing every
-- clinician in the CW12 interviews agreed decides the outcome, so it is the one
-- thing recorded as its own table rather than folded into the progress blob.
--
-- `prescribed_ml` is written alongside `consumed_ml` by the app from
-- `dosesFor()` so the constraint below has something to check against. When the
-- prescription eventually comes from the department rather than from a
-- constant, this column is where it lands and nothing else changes.

create table if not exists public.web_doses (
  phone          text not null references public.web_patients on delete cascade,
  -- Matches `Dose.id` in `web/src/domain/prep.ts` ('dose-1', 'dose-2').
  dose_id        text not null,
  prescribed_ml  int  not null check (prescribed_ml > 0),
  consumed_ml    int  not null default 0 check (consumed_ml >= 0),
  updated_at     timestamptz not null default now(),
  primary key (phone, dose_id),
  -- The app must never help a patient past the prescribed volume, and the
  -- database must never accept a row that says it did. The clamp in
  -- `recordDose` is the first line; this is the one that cannot be bypassed.
  constraint web_doses_within_prescription check (consumed_ml <= prescribed_ml)
);

-- ── progress ───────────────────────────────────────────────────────────────
-- The three self-reported signals, plus ticked-off steps. One row per patient:
-- this is a current state, not an event log, and the screens only ever read the
-- latest value.
--
-- `diet_days` is jsonb keyed by day offset ("-3", "-2", "-1") rather than by
-- date, so it survives a reschedule for the same reason the plan is derived.

create table if not exists public.web_progress (
  phone          text primary key references public.web_patients on delete cascade,
  -- Step uids, `offset:id`. Completion is per occurrence: you eat low-residue
  -- on each of three days and ticking Monday must not strike through Tuesday.
  completed      text[] not null default '{}',
  fluid_glasses  int not null default 0 check (fluid_glasses between 0 and 30),
  -- The department's own 1-5 bowel-prep scale. Null means not recorded, which
  -- is not the same as 1 -- see UNMEASURED in `domain/progress.ts`.
  stool_point    smallint check (stool_point between 1 and 5),
  diet_days      jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

-- ── one-time code sends ────────────────────────────────────────────────────
-- The resend cooldown. Until now it lived in a signed cookie, which limits a
-- *device* rather than a number: clearing cookies asked for another code. This
-- table is the shared storage that `lib/otp.ts` said was the one thing to add.
--
-- No code, hash or verification state is stored. Twilio Verify owns generation,
-- expiry, attempt limits and replay, which is the part of an OTP flow that is
-- easy to get subtly wrong. This is only "when did we last send to this
-- number", and it is keyed on the number rather than the browser.

create table if not exists public.web_otp_sends (
  phone         text primary key check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  last_sent_at  timestamptz not null default now(),
  -- Lifetime count, for spotting a number being hammered. Not a limit.
  sends         int not null default 1
);

/**
 * Claim a send slot for a number, atomically.
 *
 * Returns 0 when the caller may send, or the number of seconds to wait. Read
 * then write in two statements would let two concurrent taps both see an
 * expired cooldown and both send; the conditional upsert makes the check and
 * the claim one statement, so the loser gets a wait instead of an SMS.
 */
create or replace function public.web_otp_claim(p_phone text, p_cooldown int)
returns int
language plpgsql
as $$
declare
  v_wait int;
begin
  insert into public.web_otp_sends as s (phone, last_sent_at, sends)
  values (p_phone, now(), 1)
  on conflict (phone) do update
     set last_sent_at = now(),
         sends        = s.sends + 1
   where s.last_sent_at <= now() - make_interval(secs => p_cooldown);

  -- FOUND is false when the ON CONFLICT predicate rejected the update, i.e.
  -- the previous send is still inside the cooldown window.
  if found then
    return 0;
  end if;

  select ceil(
           extract(epoch from
             (last_sent_at + make_interval(secs => p_cooldown)) - now())
         )::int
    into v_wait
    from public.web_otp_sends
   where phone = p_phone;

  return greatest(coalesce(v_wait, 1), 1);
end;
$$;

-- ── the assistant's transcript ─────────────────────────────────────────────
-- Written server-side by `/api/ask`, and never sent back to the browser: the
-- conversation on screen is component state, and it is not restored on reload.
--
-- It is stored for one reason, and it is the ward's rather than the patient's:
-- `escalated` is how a department finds out whether the assistant actually told
-- someone to call when it should have. A guardrail nobody can audit is a claim,
-- not a control. `blocked_rule` records which of the two NEVER rules replaced a
-- reply, so a pattern that fires too often can be found and fixed.

create table if not exists public.web_chat_messages (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null references public.web_patients on delete cascade,
  role          text not null check (role in ('patient','assistant')),
  content       text not null,
  escalated     boolean not null default false,
  blocked_rule  text,
  created_at    timestamptz not null default now()
);
create index if not exists web_chat_messages_phone_idx
  on public.web_chat_messages (phone, created_at);
-- The audit query the paragraph above exists for.
create index if not exists web_chat_messages_escalated_idx
  on public.web_chat_messages (created_at desc) where escalated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════
-- Enabled with no policies, which denies everything. The service role bypasses
-- RLS, and that is the *only* way these tables are read or written.
--
-- A table added here later without these lines is readable by every anonymous
-- visitor holding the public anon key, so this block is the checklist as much
-- as it is the policy.

alter table public.web_patients      enable row level security;
alter table public.web_procedures    enable row level security;
alter table public.web_doses         enable row level security;
alter table public.web_progress      enable row level security;
alter table public.web_otp_sends     enable row level security;
alter table public.web_chat_messages enable row level security;

-- Belt and braces. RLS already denies these roles; revoking the grant means a
-- future `create policy` written by mistake still cannot open the table to the
-- browser, because the underlying privilege is gone.
revoke all on public.web_patients      from anon, authenticated;
revoke all on public.web_procedures    from anon, authenticated;
revoke all on public.web_doses         from anon, authenticated;
revoke all on public.web_progress      from anon, authenticated;
revoke all on public.web_otp_sends     from anon, authenticated;
revoke all on public.web_chat_messages from anon, authenticated;

revoke all on function public.web_otp_claim(text, int) from public, anon, authenticated;
grant execute on function public.web_otp_claim(text, int) to service_role;


-- ═══════════════════════════════════════════════════════════════════════════
-- The demo cohort
-- ═══════════════════════════════════════════════════════════════════════════
--
-- The same three patients as the in-memory fixture in `src/lib/patients.ts`,
-- so `PATIENT_SOURCE=supabase` can be switched on and the app still has
-- something to show. Three points in the run-up, because the interesting bugs
-- in a date-derived plan only show up at the boundaries. Dates are relative to
-- `current_date`, so re-running this file moves them back to those boundaries.
--
-- Note what is *not* seeded: the four signals. There is no column for them,
-- because the portal derives all four from what the patient recorded -- doses
-- drunk, glasses drunk, bowel scale point, diet days answered. So the rows
-- below are recordings, and the amber flag Lim Ah Kow shows up with is produced
-- by the same code that will produce a real patient's. Seeding the signals
-- directly would have meant the demo exercised a path the ward never sees.
--
-- His four work out as diet 0.60, timing 0.55, fluids 0.75, output 0.50, for a
-- weighted 0.56 -- amber. Note output lands *exactly* on the 0.50 red line and
-- so does not trip the critical-signal rule, which fires strictly below it.
-- Scale point 2 instead of 3 would make him red.

-- ── the cohort ─────────────────────────────────────────────────────────────

insert into public.web_patients (phone, display_name, language, reader) values
  ('+6591234567', 'Tan Wei Ming', 'en', 'patient'),
  ('+6598765432', 'Siti Rahman',  'en', 'patient'),
  ('+6590001111', 'Lim Ah Kow',   'en', 'caregiver')
on conflict (phone) do update
  set display_name = excluded.display_name,
      language     = excluded.language,
      reader       = excluded.reader,
      updated_at   = now();

-- Re-runnable: drop this cohort's procedures rather than accumulating a new one
-- on every run, which would leave the portal reading a stale latest date.
delete from public.web_procedures
 where phone in ('+6591234567', '+6598765432', '+6590001111');

insert into public.web_procedures
  (phone, scheduled_for, arrive_at, hospital, location, department_phone)
values
  -- Deep in the wait -- the stretch a paper sheet cannot survive.
  ('+6591234567', current_date + 384, '08:30',
   'Singapore General Hospital', 'Block 3, Level 4 — Endoscopy Centre', '+6563265656'),
  -- Mid diet days: the experience half of the split.
  ('+6598765432', current_date + 2, '07:45',
   'Singapore General Hospital', 'Block 3, Level 4 — Endoscopy Centre', '+6563265656'),
  -- The purge night, with the second dose still ahead: the outcome half.
  ('+6590001111', current_date + 1, '09:00',
   'Changi General Hospital', 'Medical Centre, Level 2', '+6567888833');

-- ── what each has recorded ─────────────────────────────────────────────────
--
-- Tan Wei Ming has recorded nothing: over a year out, there is nothing to
-- record. He is the case that must read "not recorded" rather than zero, so he
-- deliberately gets no row at all.

-- Siti Rahman, two days out, mid diet days.
--   diet    (mostly + stuck to it) / 2 = 0.80
--   fluid   6 / 8                      = 0.75
--   timing, output                     = not recorded
insert into public.web_progress (phone, completed, fluid_glasses, stool_point, diet_days)
values (
  '+6598765432',
  array['-3:low-residue', '-3:fluids-day', '-2:low-residue'],
  6,
  null,
  '{"-3": "mostly", "-2": "yes"}'::jsonb
)
on conflict (phone) do update
  set completed     = excluded.completed,
      fluid_glasses = excluded.fluid_glasses,
      stool_point   = excluded.stool_point,
      diet_days     = excluded.diet_days,
      updated_at    = now();

-- Lim Ah Kow, the purge night, first dose down and the second still ahead.
--   diet    three "mostly" days        = 0.60
--   fluid   6 / 8                      = 0.75
--   output  scale point 3 -> (3-1)/4   = 0.50
--   timing  1100 / 2000ml              = 0.55   (from the dose rows below)
-- Timing and output both sit under the 0.75 amber line, and timing is one of
-- the two critical signals -- which is the point of having him in the cohort.
insert into public.web_progress (phone, completed, fluid_glasses, stool_point, diet_days)
values (
  '+6590001111',
  array[
    '-7:confirm-meds', '-7:arrange-escort', '-7:collect-prep',
    '-3:low-residue', '-2:low-residue',
    '-1:clear-only', '-1:dose-1', '-1:fluid-after-1'
  ],
  6,
  3,
  '{"-3": "mostly", "-2": "mostly", "-1": "mostly"}'::jsonb
)
on conflict (phone) do update
  set completed     = excluded.completed,
      fluid_glasses = excluded.fluid_glasses,
      stool_point   = excluded.stool_point,
      diet_days     = excluded.diet_days,
      updated_at    = now();

-- The purgative. `prescribed_ml` matches `dosesFor()` in `domain/prep.ts`; the
-- 100ml against the second dose is a patient who has started it and stopped,
-- which is the case the flag exists to catch.
insert into public.web_doses (phone, dose_id, prescribed_ml, consumed_ml) values
  ('+6590001111', 'dose-1', 1000, 1000),
  ('+6590001111', 'dose-2', 1000,  100)
on conflict (phone, dose_id) do update
  set prescribed_ml = excluded.prescribed_ml,
      consumed_ml   = excluded.consumed_ml,
      updated_at    = now();

commit;
