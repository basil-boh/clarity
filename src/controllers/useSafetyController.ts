import { useQuery } from '@tanstack/react-query';
import { Linking } from 'react-native';

import { fetchProcedure } from '@/models/prep/prep.repository';

/** Emergency number for Singapore. */
const EMERGENCY = '995';

/**
 * Getting help (feature 08).
 *
 * Dialling lives here rather than in the screen so the number is normalised in
 * one place: a `tel:` URL with spaces in it silently fails to open the dialler
 * on Android, and the department number comes from free text typed by staff.
 */
export function useSafetyController() {
  const procedure = useQuery({ queryKey: ['procedure'], queryFn: fetchProcedure });

  function dial(number: string) {
    const cleaned = number.replace(/[^\d+]/g, '');
    if (!cleaned) return;
    void Linking.openURL(`tel:${cleaned}`);
  }

  return {
    procedure: procedure.data,
    callDepartment: () => procedure.data && dial(procedure.data.departmentPhone),
    callEmergency: () => dial(EMERGENCY),
  };
}
