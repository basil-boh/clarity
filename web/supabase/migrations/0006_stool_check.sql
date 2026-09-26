-- ═══════════════════════════════════════════════════════════════════════════
-- Colonaid web portal · guided stool check-in
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Paste into the Supabase SQL editor and run once, after 0005. Safe to re-run.
--
-- Patient-entered observations replace the stool photograph check.
-- Historical photo assessments remain available to staff.
--
-- Until this is applied every "Save my check-in" fails: the app writes
-- `stool_check` and PostgREST rejects the unknown column.

begin;

alter table public.web_progress
  add column if not exists stool_check jsonb;

-- `add constraint` has no `if not exists`; drop first so a re-run succeeds.
alter table public.web_progress
  drop constraint if exists web_progress_stool_check_object;
alter table public.web_progress
  add constraint web_progress_stool_check_object
  check (stool_check is null or jsonb_typeof(stool_check) = 'object');

commit;

-- PostgREST caches the schema; without this the new column stays invisible
-- to the app (PGRST204) until the cache happens to refresh.
notify pgrst, 'reload schema';
