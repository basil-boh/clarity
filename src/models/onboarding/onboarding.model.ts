import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether the welcome tour still needs to run.
 *
 * The flag lives in a small module-level store rather than React state because
 * two unrelated places read it (the router gate in `app/_layout.tsx` and the
 * tour itself) and they have to agree the instant it changes.
 * `useSyncExternalStore` gives both the same value without another provider
 * wrapping the tree.
 *
 * Version the key rather than reusing it. If the tour is rewritten, bumping
 * `v1` shows the new one to existing users instead of leaving them with a flag
 * asserting they have seen slides that no longer exist. That matters more here
 * than in most apps: slide five states the two things the app will never do,
 * and if those guarantees ever change, everyone needs to see the new wording.
 */
const STORAGE_KEY = 'clarity.onboarding.seen.v1';

/**
 * In development the tour replays on every cold start, so it can be worked on
 * without clearing app storage between runs; in a release build it runs once.
 * The completion is still written in development, so the production path is
 * exercised by the same code: only the read is skipped.
 *
 * Fast Refresh keeps module state, so editing a slide will not throw you back
 * to the start. A full reload (`r` in the dev server) does.
 */
const REPLAY_EVERY_LAUNCH = __DEV__;

/** `unknown` until storage has been read. The gate holds the splash on it. */
type Status = 'unknown' | 'pending' | 'complete';

let status: Status = 'unknown';
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setStatus(next: Status) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

function ensureHydrated() {
  hydrating ??= (async () => {
    if (REPLAY_EVERY_LAUNCH) {
      setStatus('pending');
      return;
    }
    try {
      const seen = await AsyncStorage.getItem(STORAGE_KEY);
      setStatus(seen ? 'complete' : 'pending');
    } catch {
      // Unreadable storage should not trap anyone behind the tour forever, but
      // it also must not skip it on a genuine first run: slide five is the
      // only place the guardrails are stated. Showing it is the recoverable
      // half of that trade: worst case, a returning user sees five slides
      // again.
      setStatus('pending');
    }
  })();
  return hydrating;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void ensureHydrated();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return status;
}

/** Marks the tour done for this launch, and quietly for every future one. */
export async function completeOnboarding() {
  setStatus('complete');
  try {
    await AsyncStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // The session has already moved on; a failed write only means the tour runs
    // again next launch, which is not worth interrupting anyone over.
  }
}

/** Clears the flag so the tour runs again. Reachable from Profile. */
export async function resetOnboarding() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  setStatus('pending');
}

export function useOnboarding() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const complete = useCallback(() => {
    void completeOnboarding();
  }, []);

  return {
    /** False while storage is still being read; the router waits on this. */
    isReady: current !== 'unknown',
    needsOnboarding: current === 'pending',
    complete,
  };
}
