-- ═══════════════════════════════════════════════════════════════════════════
-- Clarity web portal · the first-sign-in questionnaire
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Paste into the Supabase SQL editor and run once, after 0002. Safe to re-run.
-- Until it has run, patients are simply not asked, and the Diet page shows the
-- standard lists.

begin;

-- One row per patient, written when they answer or skip. No row means they
-- have not been asked yet, which is what sends them to the questions at sign-in.
-- Every answer is optional: null is "prefer not to say", and an empty `diets`
-- is "no restrictions". The allowed values match `src/domain/questionnaire.ts`.

create table if not exists public.web_questionnaire (
  phone        text primary key references public.web_patients on delete cascade,
  age_range    text check (age_range in ('under-40','40-49','50-59','60-69','70-79','80-plus')),
  gender       text check (gender in ('female','male','other')),
  ethnicity    text check (ethnicity in ('chinese','malay','indian','other')),
  diets        text[] not null default '{}'
                 check (diets <@ array['halal','vegetarian','vegan','no-pork','no-beef']),
  skipped      boolean not null default false,
  answered_at  timestamptz not null default now()
);

-- Same rules as every other web_ table: only the server, holding the service
-- role, reaches it. Ethnicity and diet are sensitive; nothing public can read them.
alter table public.web_questionnaire enable row level security;
revoke all on public.web_questionnaire from anon, authenticated;

commit;

notify pgrst, 'reload schema';
