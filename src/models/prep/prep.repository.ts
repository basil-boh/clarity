import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

import {
  DEMO_PROCEDURE,
  DEMO_PROFILE,
  DEMO_SIGNALS,
  demoProcedureDate,
  readDemoDoses,
  writeDemoDose,
} from './prep.fixtures';
import type { Dose, FlagSignals, Language, Procedure, Profile, Reader } from './prep.types';

/**
 * Data access for the preparation.
 *
 * The Model owns *how* data is fetched and shaped; controllers own when and
 * what to do with it. Nothing in here knows about React, and nothing in here
 * renders: that separation is the whole point of the layer, and it is what
 * makes the fixture fallback below possible without a second code path in the
 * screens.
 *
 * **Every function falls back to a fixture when no backend is configured.**
 * That keeps a fresh clone runnable, which matters for a hackathon scaffold.
 * The fallback is explicit at each callsite rather than hidden in the client so
 * it is obvious what is real and what is not.
 */

function offline() {
  return !env.isBackendReady || supabase === null;
}

export async function fetchProfile(): Promise<Profile> {
  if (offline()) return DEMO_PROFILE;

  const { data: auth } = await supabase!.auth.getUser();
  if (!auth.user) return DEMO_PROFILE;

  const { data, error } = await supabase!
    .from('profiles')
    .select('*')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return DEMO_PROFILE;

  return {
    displayName: data.display_name,
    language: data.language as Language,
    reader: data.reader as Reader,
    yearOfBirth: data.year_of_birth ?? 0,
    dietaryPreferences: data.dietary_preferences,
    allergies: data.allergies,
    conditions: data.conditions,
    medicines: data.medicines,
  };
}

export async function fetchProcedure(): Promise<Procedure> {
  if (offline()) return DEMO_PROCEDURE;

  const { data, error } = await supabase!
    .from('procedures')
    .select('*')
    .order('scheduled_for', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...DEMO_PROCEDURE, date: demoProcedureDate() };

  return {
    date: data.scheduled_for,
    hospital: data.hospital,
    location: data.location,
    arriveAt: data.arrive_at ?? '',
    departmentPhone: data.department_phone,
  };
}

export async function fetchDoses(): Promise<Dose[]> {
  if (offline()) return readDemoDoses();

  const { data, error } = await supabase!
    .from('doses')
    .select('*')
    .order('scheduled_at', { ascending: true });
  if (error) throw error;
  if (!data?.length) return readDemoDoses();

  return data.map((row) => ({
    id: row.id,
    label: row.label,
    scheduledAt: row.scheduled_at,
    volumeMl: row.volume_ml,
    consumedMl: row.consumed_ml,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  }));
}

/**
 * Record how much of a dose has actually gone down.
 *
 * Clamped to the prescribed volume here *and* by a check constraint on the
 * table. Neither is redundant: the constraint is the guarantee, and the clamp
 * is what stops a legitimate over-tap from surfacing as a database error to a
 * patient at 1am.
 */
export async function recordDoseProgress(doseId: string, consumedMl: number): Promise<void> {
  if (offline()) {
    writeDemoDose(doseId, consumedMl);
    return;
  }

  const { data: existing, error: readError } = await supabase!
    .from('doses')
    .select('volume_ml')
    .eq('id', doseId)
    .maybeSingle();
  if (readError) throw readError;

  const capped = Math.max(0, Math.min(consumedMl, existing?.volume_ml ?? consumedMl));
  const { error } = await supabase!
    .from('doses')
    .update({
      consumed_ml: capped,
      completed_at: capped >= (existing?.volume_ml ?? Infinity) ? new Date().toISOString() : null,
    })
    .eq('id', doseId);
  if (error) throw error;
}

export async function fetchFlagSignals(): Promise<FlagSignals> {
  if (offline()) return DEMO_SIGNALS;

  const { data, error } = await supabase!.from('flag_signals').select('*').maybeSingle();
  if (error) throw error;
  if (!data) return DEMO_SIGNALS;

  return {
    dietCompliance: data.diet_compliance,
    prepTiming: data.prep_timing,
    fluidIntake: data.fluid_intake,
    bowelOutput: data.bowel_output,
  };
}
