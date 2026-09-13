import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

import type { BowelScalePoint, MealCheck, MealVerdict, StoolReading } from './prep.types';

/**
 * The two photograph checks.
 *
 * **Nothing here takes an image, and nothing here stores one.** A photograph is
 * captured on the device, sent to whatever service scores it, and dropped; only
 * the verdict, the confidence and the time are persisted. The tables have no
 * image column at all: see rule 2 in `supabase/migrations/0001_init.sql`. The
 * app tells patients the photo stays with them, and that has to be true in the
 * schema rather than in the copy.
 *
 * ── SCAFFOLD ───────────────────────────────────────────────────────────────
 * `scoreMeal` and `scoreStool` return fixed examples. The real ones post the
 * frame to a vision endpoint, which, like the chat key, belongs behind an Edge
 * Function and not in the bundle.
 * ───────────────────────────────────────────────────────────────────────────
 */

const DEMO_MEAL: Omit<MealCheck, 'id' | 'at'> = {
  verdict: 'avoid' as MealVerdict,
  confidence: 0.78,
  items: ['coconut rice', 'peanuts', 'cucumber', 'fried egg'],
  reason: 'Peanuts and cucumber skin leave residue. The rice and egg on their own would be fine.',
};

const DEMO_STOOL: Omit<StoolReading, 'id' | 'at'> = {
  point: 3 as BowelScalePoint,
  confidence: 0.62,
  inconclusive: false,
};

export async function scoreMeal(): Promise<MealCheck> {
  const at = new Date().toISOString();
  const result: MealCheck = { id: `meal-${at}`, at, ...DEMO_MEAL };
  await persistMeal(result);
  return result;
}

export async function scoreStool(): Promise<StoolReading> {
  const at = new Date().toISOString();
  const result: StoolReading = { id: `stool-${at}`, at, ...DEMO_STOOL };
  await persistStool(result);
  return result;
}

async function persistMeal(check: MealCheck): Promise<void> {
  if (!env.isBackendReady || supabase === null) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  await supabase.from('meal_checks').insert({
    patient_id: auth.user.id,
    verdict: check.verdict,
    confidence: check.confidence,
    items: [...check.items],
    reason: check.reason,
  });
}

async function persistStool(reading: StoolReading): Promise<void> {
  if (!env.isBackendReady || supabase === null) return;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  await supabase.from('stool_readings').insert({
    patient_id: auth.user.id,
    point: reading.inconclusive ? null : reading.point,
    confidence: reading.confidence,
    inconclusive: reading.inconclusive,
  });
}
