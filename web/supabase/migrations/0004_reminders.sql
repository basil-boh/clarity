-- ═══════════════════════════════════════════════════════════════════════════
-- Colonaid web portal · dose reminders over Telegram
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Paste into the Supabase SQL editor and run once, after 0003. Safe to re-run.
--
-- Why this exists: the calendar export already puts alarms on a patient's
-- phone, but only for a patient who tapped "Add to calendar". The people least
-- likely to do that are the people most likely to need waking for the 2am
-- dose -- the one the department says is most often skipped and the one that
-- clears the right side of the colon. This is the half that needs nothing from
-- the patient on the night.

begin;

-- ── the Telegram link ──────────────────────────────────────────────────────
-- One row per patient who has started connecting. `chat_id` is null until the
-- bot has actually heard from them, so a row here is not proof of a working
-- channel -- `linked_at` is.
--
-- `link_token` is what goes in the t.me deep link. It is a bearer credential:
-- whoever holds it can point their own Telegram at this patient's reminders,
-- so it is unguessable, short-lived, and cleared the moment it is redeemed.

create table if not exists public.web_telegram (
  phone             text primary key references public.web_patients on delete cascade,
  chat_id           bigint,
  link_token        text unique,
  token_expires_at  timestamptz,
  linked_at         timestamptz,
  -- Set when the patient sends /stop. Kept rather than deleting the row: a
  -- deleted row would be re-offered the link on the next visit, which is the
  -- app arguing with someone who has just asked it to stop.
  stopped           boolean not null default false,
  updated_at        timestamptz not null default now()
);

create index if not exists web_telegram_token_idx
  on public.web_telegram (link_token) where link_token is not null;

-- ── what has already been sent ─────────────────────────────────────────────
-- The cron runs every fifteen minutes and a reminder stays due for half an
-- hour, so without this a patient is messaged two or three times for one dose.
-- The key is `yyyy-MM-dd:step-id` -- the date the dose actually falls on, so a
-- rescheduled procedure is a different key and is reminded about again.

create table if not exists public.web_reminders_sent (
  phone    text not null references public.web_patients on delete cascade,
  key      text not null,
  sent_at  timestamptz not null default now(),
  primary key (phone, key)
);

-- Same rules as every other web_ table: only the server, holding the service
-- role, reaches these. A chat id identifies a person on Telegram and the send
-- log says who is having a colonoscopy and when.
alter table public.web_telegram enable row level security;
alter table public.web_reminders_sent enable row level security;
revoke all on public.web_telegram from anon, authenticated;
revoke all on public.web_reminders_sent from anon, authenticated;

commit;

notify pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════════════════════
-- The scheduler
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Run this part separately, once, with your own values filled in. It is not in
-- the transaction above because it embeds a URL and a secret that differ per
-- deployment, and because pg_cron jobs are not something to re-create on every
-- migration run.
--
-- Every fifteen minutes rather than twice a day at the dose times: a reminder
-- is due for the half hour before its dose, so a missed or late run still
-- catches the patient. Missing the 2am dose reminder is the failure this whole
-- feature exists to prevent, so it is worth polling for.
--
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
--   select cron.schedule(
--     'colonaid-dose-reminders',
--     '*/15 * * * *',
--     $$
--       select net.http_post(
--         url     := 'https://YOUR-APP.vercel.app/api/reminders/send',
--         headers := jsonb_build_object(
--           'Content-Type',  'application/json',
--           'x-reminder-key', 'THE-SAME-VALUE-AS-REMINDER_CRON_SECRET'
--         ),
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- To watch it:      select * from cron.job_run_details order by start_time desc limit 20;
-- To change it:     select cron.unschedule('colonaid-dose-reminders');  then schedule again.
