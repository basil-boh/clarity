import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

import { env } from '@/lib/env';

import type { Database } from './database.types';

/**
 * The Supabase client.
 *
 * `null` when no backend is configured, rather than a client pointed at an
 * empty string. A half-built client fails at the first request with a URL
 * parse error somewhere deep in the fetch layer; `null` fails at the callsite,
 * where the repository can fall back to a fixture and say so.
 *
 * Three settings worth knowing:
 *
 * - `detectSessionInUrl: false`. That flag is for the web OAuth redirect flow.
 *   On a native client there is no URL to read a session out of, and leaving it
 *   on makes the SDK poke at `window.location` on a platform that has none.
 * - `persistSession` through AsyncStorage, so a patient is not signed out
 *   between the diet days and the purge night. Sessions are not secrets in the
 *   way an API key is (they are per-user, expiring and revocable) so
 *   AsyncStorage is the right store; SecureStore has a 2KB value limit that a
 *   JWT pair can exceed, which fails at exactly the wrong moment.
 * - `autoRefreshToken`, because the purge night runs past every default token
 *   lifetime and an expired token at 2am is a patient locked out of their own
 *   dose tracker.
 */
export const supabase: SupabaseClient<Database> | null = env.isBackendReady
  ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** Narrows the client for a call that has already checked configuration. */
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
);
  }
  return supabase;
}
