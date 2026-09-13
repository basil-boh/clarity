-- ═══════════════════════════════════════════════════════════════════════════
-- Clarity · initial schema
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Two rules govern everything below.
--
-- 1. **A patient can read and write their own rows, and nothing else.** Every
--    table carries `patient_id references auth.users` and every table has RLS
--    enabled with policies keyed on `auth.uid()`. There is no "read all" role
--    in this file; clinician access is a separate, later concern and should
--    arrive as an explicit role rather than as a loosened policy here.
--
-- 2. **No photograph is ever stored.** The meal check and the stool check
--    persist a verdict, a confidence and a timestamp. There is no bytea column,
--    no storage bucket reference, no URL. The app tells patients the photo
--    stays with them, and the schema is what makes that true rather than a
--    promise in the copy.

create extension if not exists "pgcrypto";

-- ── profiles ───────────────────────────────────────────────────────────────
-- The diet plan is generated from this. See `Profile` in models/prep.

create table public.profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text        not null default '',
  language      text        not null default 'en' check (language in ('en','zh','ms','ta')),
  reader        text        not null default 'patient' check (reader in ('patient','caregiver')),
  year_of_birth int,
  -- Free text on purpose: "halal", "no beef", "vegetarian on Fridays". An enum
  -- here would quietly drop exactly the cultural detail feature 03 exists for.
  dietary_preferences text[] not null default '{}',
  allergies           text[] not null default '{}',
  conditions          text[] not null default '{}',
  medicines           text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── procedures ─────────────────────────────────────────────────────────────
-- The plan is *derived* from `scheduled_for`, never stored per-day. A
-- rescheduled patient gets the right plan without a data migration.

create table public.procedures (
  id                uuid primary key default gen_random_uuid(),
  patient_id        uuid not null references auth.users on delete cascade,
  scheduled_for     date not null,
  arrive_at         time,
  -- The named clinic ("SGH Endoscopy Clinic"), and separately where in the
  -- building. Split so a site with no block or level renders without a
  -- dangling comma.
  hospital          text not null default '',
  location          text not null default '',
  department_phone  text not null default '',
  created_at        timestamptz not null default now()
);
create index procedures_patient_idx on public.procedures (patient_id, scheduled_for desc);

-- ── doses ──────────────────────────────────────────────────────────────────
-- Finishing the full volume at the right time is the single thing every
-- clinician in the CW12 interviews agreed decides the outcome, so it is the one
-- thing recorded in the most detail.

create table public.doses (
  id            uuid primary key default gen_random_uuid(),
  procedure_id  uuid not null references public.procedures on delete cascade,
  patient_id    uuid not null references auth.users on delete cascade,
  label         text not null,
  scheduled_at  timestamptz not null,
  volume_ml     int  not null check (volume_ml > 0),
  consumed_ml   int  not null default 0 check (consumed_ml >= 0),
  started_at    timestamptz,
  completed_at  timestamptz,
  -- The app must never suggest exceeding the prescribed volume, and the
  -- database must never accept a row that says it did.
  constraint doses_within_prescription check (consumed_ml <= volume_ml)
);
create index doses_patient_idx on public.doses (patient_id, scheduled_at);

-- ── meal checks (feature 04) ───────────────────────────────────────────────

create table public.meal_checks (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references auth.users on delete cascade,
  checked_at  timestamptz not null default now(),
  verdict     text not null check (verdict in ('ok','avoid','unsure')),
  confidence  real not null check (confidence between 0 and 1),
  items       text[] not null default '{}',
  reason      text not null default ''
  -- No image column. See rule 2 at the top of this file.
);
create index meal_checks_patient_idx on public.meal_checks (patient_id, checked_at desc);

-- ── stool readings (feature 07) ────────────────────────────────────────────

create table public.stool_readings (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references auth.users on delete cascade,
  read_at       timestamptz not null default now(),
  -- The hospital's own 1–5 bowel-prep scale, so a patient told "you want 4 or
  -- above" can hold the app's answer against the same words.
  point         smallint check (point between 1 and 5),
  confidence    real not null check (confidence between 0 and 1),
  -- True when the model declined to call it. Distinct from a low confidence:
  -- "I cannot tell" is an answer, and the UI renders it differently.
  inconclusive  boolean not null default false,
  constraint stool_point_present check (inconclusive or point is not null)
  -- No image column.
);
create index stool_readings_patient_idx on public.stool_readings (patient_id, read_at desc);

-- ── chat (feature 05) ──────────────────────────────────────────────────────
-- Written by the Edge Function, read by the patient. The function inserts both
-- sides of the exchange so a reply cannot be attributed to the assistant
-- without the question that produced it.

create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references auth.users on delete cascade,
  role        text not null check (role in ('patient','assistant')),
  content     text not null,
  -- Set when the assistant judged the question needs a person, so the ward can
  -- later audit whether escalation actually fired when it should have.
  escalated   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index chat_messages_patient_idx on public.chat_messages (patient_id, created_at);

-- ── the flag (feature 09) ──────────────────────────────────────────────────
-- Signals are stored; the colour is not. `computeFlag` in the app derives it,
-- so patient and nurse cannot end up looking at two different rules, and
-- changing the thresholds does not require rewriting history.

create table public.flag_signals (
  patient_id       uuid primary key references auth.users on delete cascade,
  -- -1 means "not measured", which is not the same as zero: a patient who never
  -- opened the app has not failed their prep. See UNMEASURED in flag.rules.
  diet_compliance  real not null default -1,
  prep_timing      real not null default -1,
  fluid_intake     real not null default -1,
  bowel_output     real not null default -1,
  updated_at       timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════
-- Enabled on every table. A table added later without these three lines is
-- readable by every authenticated user of the project, so this block is the
-- checklist as much as it is the policy.

alter table public.profiles       enable row level security;
alter table public.procedures     enable row level security;
alter table public.doses          enable row level security;
alter table public.meal_checks    enable row level security;
alter table public.stool_readings enable row level security;
alter table public.chat_messages  enable row level security;
alter table public.flag_signals   enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own procedures" on public.procedures
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

create policy "own doses" on public.doses
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

create policy "own meal checks" on public.meal_checks
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

create policy "own stool readings" on public.stool_readings
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

-- Read-only from the client. Both sides of a conversation are written by the
-- Edge Function under the service role, so a patient cannot forge an
-- "assistant" message that appears to authorise something.
create policy "own chat, read only" on public.chat_messages
  for select using (auth.uid() = patient_id);

create policy "own flag signals" on public.flag_signals
  for all using (auth.uid() = patient_id) with check (auth.uid() = patient_id);

-- ── a profile row for every new user ───────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  insert into public.flag_signals (patient_id) values (new.id) on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
