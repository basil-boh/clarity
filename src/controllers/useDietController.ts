import { useQuery } from '@tanstack/react-query';

import { fetchProfile } from '@/models/prep/prep.repository';

/**
 * The diet screen.
 *
 * The profile line at the top is load bearing, not decoration: the argument of
 * feature 03 is that the plan is *this patient's*, and a screen that renders
 * the same four food groups for everyone is a leaflet with a nicer typeface.
 * When the plan itself is generated server-side, it is fetched here.
 */
export function useDietController() {
  const profile = useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

  const tailoredFor = profile.data
    ? [
        ...profile.data.dietaryPreferences,
        ...profile.data.allergies.map((allergy) => `no ${allergy}`),
      ]
    : [];

  return { profile: profile.data, tailoredFor };
}
