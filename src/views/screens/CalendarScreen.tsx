import { StyleSheet, View } from 'react-native';

import { useTodayController } from '@/controllers/useTodayController';
import {
  Card,
  Notice,
  Overline,
  PhaseLegend,
  PrepCalendar,
  Screen,
  ScreenHeader,
  Stagger,
  Text,
} from '@/views/components/ui';
import { spacing } from '@/theme';

/**
 * The whole run-up, on a calendar.
 *
 * Reached from the phase strip on Today. It exists because the strip answers
 * "which phase am I in" and this answers "which day is which", and the second
 * question is the one asked at the referral appointment (sometimes two years
 * out) by someone who has to book leave, arrange a lift and warn their family
 * about the night they will not sleep.
 *
 * Read-only on purpose. Every date on this screen is derived from the procedure
 * date the department set; a patient who could drag their diet days would be
 * able to build a plan their endoscopist has never seen.
 */
export default function CalendarScreen() {
  const { procedure } = useTodayController();

  return (<Screen edges="none">
      <ScreenHeader subtitle="Every date is set by the department." />

      {procedure ? (<Stagger>
          <View key="head" style={styles.head}>
            <Overline>The run-up</Overline>
            <Text variant="display">{procedure.hospital}</Text>
            <Text variant="callout" tone="muted">
              Colour deepens as the day approaches. The key below gives the dates.
            </Text>
          </View>

          <Card key="grid">
            <PrepCalendar procedureDate={procedure.date} />
          </Card>

          <Card key="legend">
            <Overline>What the colours mean</Overline>
            <View style={styles.legend}>
              <PhaseLegend procedureDate={procedure.date} />
            </View>
          </Card>

          <Notice
            key="change"
            icon="phone-call"
            title="Been given a new date?"
            detail="Call the department. Every date here is worked out from theirs."
            href="/safety"
          />
        </Stagger>
) : null}
    </Screen>
);
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs },
  legend: { marginTop: spacing.md },
});
