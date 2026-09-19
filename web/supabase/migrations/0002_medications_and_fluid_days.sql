-- ═══════════════════════════════════════════════════════════════════════════
-- Clarity web portal · medication instructions, and clear fluid by day
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Paste into the Supabase SQL editor and run once, after 0001. Safe to re-run:
-- everything is `if not exists`, and nothing here touches an existing row.
--
-- Until it has run the app keeps working on the old behaviour -- fluid as one
-- running count, medication instructions lost when the page is left -- and
-- logs which file to apply.

begin;

-- ── clear fluid, per day ───────────────────────────────────────────────────
-- Singapore date (`yyyy-MM-dd`) → glasses. `fluid_glasses` stays, holding
-- today's count, for anything that already reads it; the app reads this.

alter table public.web_progress
  add column if not exists fluid_days jsonb not null default '{}'::jsonb;

-- ── medication instructions ────────────────────────────────────────────────
-- The entries a patient checked against their department's sheet and added to
-- their plan, as the review screen made them: the medicine, take or hold, the
-- times, the sheet's own words. **Never the photographs** -- those go to OpenAI
-- to be read and are dropped, and there is still no column that could hold one.
-- One row per patient, replaced whole on each save.

create table if not exists public.web_medications (
  phone       text primary key references public.web_patients on delete cascade,
  entries     jsonb not null default '[]'::jsonb
                check (jsonb_typeof(entries) = 'array'),
  updated_at  timestamptz not null default now()
);

-- Same rules as every other web_ table: RLS on, no policies, nothing for anon
-- or authenticated. Only the server, holding the service role, reaches it.
alter table public.web_medications enable row level security;
revoke all on public.web_medications from anon, authenticated;

commit;

-- Tell PostgREST about the new table and column now rather than on its next
-- schema reload.
notify pgrst, 'reload schema';
