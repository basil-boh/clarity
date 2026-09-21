-- ═══════════════════════════════════════════════════════════════════════════
-- Colonaid web portal · photograph readings, and what staff should look at
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Paste into the Supabase SQL editor and run once, after 0004. Safe to re-run.
--
-- **No image is stored here, or anywhere.** The photograph is sent to the model,
-- read, and dropped. What is kept is a number on the department's own 1-5 scale
-- and how sure the model was -- which is the same information a patient gives
-- by tapping a swatch, plus a note on how it was arrived at.
--
-- That is a deliberate choice and not only a storage one. These are
-- identifiable medical images; not holding them means there is nothing to leak,
-- nothing to subject-access, and no retention policy to get wrong. The cost is
-- that staff cannot second-guess a reading against the picture, which is why
-- the model's own reading is kept beside the patient's and a disagreement
-- between them is itself a flag.

begin;

create table if not exists public.web_verifications (
  id                uuid primary key default gen_random_uuid(),
  phone             text not null references public.web_patients on delete cascade,
  assessed_at       timestamptz not null default now(),

  -- What the model proposed, on the scale in `domain/progress.ts`.
  suggested_point   smallint check (suggested_point between 1 and 5),
  -- The model's own confidence. Not a probability of anything clinical.
  confidence        real not null default 0 check (confidence between 0 and 1),
  usable            boolean not null default false,
  note              text not null default '',

  -- What the patient accepted, which is what was actually recorded against
  -- their progress. Null while they have not yet confirmed.
  accepted_point    smallint check (accepted_point between 1 and 5),

  -- Whether a person should look, and why. Stored rather than recomputed so
  -- that changing a threshold later does not silently rewrite history.
  flagged           boolean not null default false,
  flag_reasons      text[] not null default '{}'
                      check (flag_reasons <@ array[
                        'low-reading','low-confidence','unusable','disagreement'
                      ])
);

-- The admin view asks one question: who needs looking at, most recent first.
create index if not exists web_verifications_flagged_idx
  on public.web_verifications (flagged, assessed_at desc) where flagged;

create index if not exists web_verifications_phone_idx
  on public.web_verifications (phone, assessed_at desc);

-- Same rules as every other web_ table: only the server, holding the service
-- role, reaches it. This says who is having a colonoscopy and how it is going.
alter table public.web_verifications enable row level security;
revoke all on public.web_verifications from anon, authenticated;

commit;

notify pgrst, 'reload schema';
