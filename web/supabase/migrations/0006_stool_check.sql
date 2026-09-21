-- Patient-entered observations replace the stool photograph check.
-- Historical photo assessments remain available to staff.
alter table public.web_progress
  add column if not exists stool_check jsonb;

alter table public.web_progress
  add constraint web_progress_stool_check_object
  check (stool_check is null or jsonb_typeof(stool_check) = 'object');
