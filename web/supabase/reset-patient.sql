-- ═══════════════════════════════════════════════════════════════════════════
-- Colonaid web portal · resetting one patient
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Not a migration. Paste one of the blocks below into the Supabase SQL editor,
-- change the number at the top of it, and run.
--
-- "Reset" means three different things and they are not interchangeable, so
-- they are three separate blocks. Pick the smallest one that does what you
-- want: B and C throw away things a patient cannot get back by themselves.
--
-- Every block is keyed on the number in E.164 -- `+6591234567`, not
-- `9123 4567`. A number that does not match simply deletes nothing, which is
-- the safe direction, but it also means a typo looks exactly like success.
-- Run block 0 first and check the counts change.

-- ───────────────────────────────────────────────────────────────────────────
-- 0 · What is there now
-- ───────────────────────────────────────────────────────────────────────────
-- Read-only. Run before and after so "it worked" is something you saw rather
-- than something you assumed.

select 'patient'       as record, count(*) from public.web_patients        where phone = '+6591234567'
union all select 'procedure',     count(*) from public.web_procedures      where phone = '+6591234567'
union all select 'progress',      count(*) from public.web_progress        where phone = '+6591234567'
union all select 'doses',         count(*) from public.web_doses           where phone = '+6591234567'
union all select 'chat',          count(*) from public.web_chat_messages   where phone = '+6591234567'
union all select 'questionnaire', count(*) from public.web_questionnaire   where phone = '+6591234567'
union all select 'verifications', count(*) from public.web_verifications   where phone = '+6591234567'
union all select 'reminders_log', count(*) from public.web_reminders_sent  where phone = '+6591234567'
union all select 'telegram',      count(*) from public.web_telegram        where phone = '+6591234567'
union all select 'medications',   count(*) from public.web_medications     where phone = '+6591234567';


-- ───────────────────────────────────────────────────────────────────────────
-- A · Make them fill the welcome form in again
-- ───────────────────────────────────────────────────────────────────────────
-- The narrowest reset, and usually the one meant by "reset the questionnaire".
--
-- Deletes only the procedure. `findPatient` returns null unless it finds both a
-- patient row and a procedure row, so the next sign-in lands on /welcome with
-- an empty form -- while their Telegram link, recorded progress and medication
-- instructions all survive, because those hang off the patient row and it is
-- untouched.
--
-- Note this is NOT the same as the patient tapping "Change your details" on
-- Home, which opens the form already filled in. Use that if you only want them
-- to correct something.

do $$
declare target text := '+6591234567';
begin
  delete from public.web_procedures where phone = target;
  raise notice 'Cleared the procedure for %. Next sign-in lands on an empty /welcome.', target;
end $$;


-- ───────────────────────────────────────────────────────────────────────────
-- B · Clear what they recorded
-- ───────────────────────────────────────────────────────────────────────────
-- The same thing the "Clear recorded progress" button in /admin does. Their
-- name, language, procedure date, Telegram link and medication instructions
-- all stay; everything they did during the run-up goes.
--
-- `web_verifications` and `web_reminders_sent` are in here for a reason. Left
-- behind, a cleared patient keeps a red "needs a look" in /admin pointing at
-- photograph readings that no longer exist, and is silently skipped for dose
-- reminders they have not now had.

do $$
declare target text := '+6591234567';
begin
  delete from public.web_progress       where phone = target;
  delete from public.web_doses          where phone = target;
  delete from public.web_chat_messages  where phone = target;
  delete from public.web_questionnaire  where phone = target;
  delete from public.web_verifications  where phone = target;
  delete from public.web_reminders_sent where phone = target;

  -- Deliberately NOT cleared: web_medications. Those are the department's
  -- instructions as the patient entered them, not something they did during
  -- the run-up, and re-entering them is real work. Uncomment to include it.
  -- delete from public.web_medications where phone = target;

  raise notice 'Cleared recorded progress for %.', target;
end $$;


-- ───────────────────────────────────────────────────────────────────────────
-- C · Start again from zero
-- ───────────────────────────────────────────────────────────────────────────
-- As if the number had never been used. Everything in the list above is keyed
-- on `web_patients` with `on delete cascade`, so deleting that one row takes
-- the lot -- including their Telegram link, which they will have to reconnect.
--
-- `web_otp_sends` is the exception: it holds the resend cooldown and has no
-- foreign key to `web_patients`, deliberately, because the cooldown has to
-- work for numbers that have no record at all. So it survives the cascade and
-- is deleted here by name. Leaving it means the first sign-in after a reset
-- can be refused for up to OTP_RESEND_SECONDS with "please wait", which looks
-- exactly like the reset having broken something.

do $$
declare target text := '+6591234567';
begin
  delete from public.web_patients  where phone = target;   -- cascades
  delete from public.web_otp_sends where phone = target;   -- does not cascade
  raise notice 'Deleted everything for %.', target;
end $$;
