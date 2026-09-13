import { QueryClient } from '@tanstack/react-query';

/**
 * One client for the app's lifetime.
 *
 * `staleTime` is short and `retry` is low on purpose. Most of what this app
 * fetches is time-sensitive (where you are in the plan, when the next dose is
 * due) and a cheerfully cached answer to "what should I do now" at half past
 * midnight is worse than a spinner.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}
