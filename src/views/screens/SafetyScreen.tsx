import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Overline, Screen, Stagger, Text } from '@/views/components/ui';
import { NEVER } from '@/models/flag/flag.rules';
import { useSafetyController } from '@/controllers/useSafetyController';
import { colors, spacing } from '@/theme';

/**
 * The route to a person (feature 08).
 *
 * The gastroenterologist's position was that AI can make the call in this app
 * *provided* patients know these are suggestions and know how to reach someone
 * if worried. This screen is the second half of that condition, which is why it
 * is reachable from the Today screen, the chatbot, the stool check and the
 * prep-night screen rather than living in a settings menu.
 *
 * The ordering is deliberate and it is the opposite of what a disclaimer screen
 * usually does. Who to call comes first, at the top, with a working phone
 * button. The limits of the software come second. A frightened patient at 1am
 * should not have to scroll past legal text to find a number.
 */

/**
 * When to stop using the app and call.
 *
 * These are the things no chatbot should be triaging. Deliberately concrete:
 * "severe" and "unwell" are not thresholds a frightened person can apply to
 * themselves at 1am.
 */
const CALL_NOW = [
  'You are vomiting and cannot keep any of the preparation down',
  'You have severe stomach pain, or a swollen hard belly',
  'You have not passed anything at all four hours after a dose',
  'You feel faint, dizzy or confused',
  'There is a lot of fresh blood',
];

export default function SafetyScreen() {
  const { procedure, callDepartment, callEmergency } = useSafetyController();
  const phone = procedure?.departmentPhone;

  return (<Screen edges="none">
      <Stagger>
        <View key="head" style={styles.head}>
          <Overline tone="alert">If you are worried</Overline>
          <Text variant="display">Talk to a person</Text>
        </View>

        <Card key="call" style={styles.callCard}>
          <Text variant="bodyStrong">Your endoscopy department</Text>
          <Text variant="callout" tone="muted" style={styles.gapSm}>
            {procedure?.hospital ?? 'Your hospital'}. The number is on your appointment letter.
          </Text>
          <Button
            label={phone ? `Call ${phone}` : 'Call the department'}
            icon="call"
            size="lg"
            fullWidth
            style={styles.gapMd}
            onPress={callDepartment}
          />
          <Text variant="caption" tone="faint" style={styles.gapSm}>
            Outside office hours this may divert. If it does, and any of the below applies, go to
            the nearest A&amp;E.
          </Text>
        </Card>

        <Card key="emergency" style={styles.emergency}>
          <View style={styles.row}>
            <Ionicons name="alert-circle" size={22} color={colors.alert} />
            <Text variant="bodyStrong" tone="alert">
              Do not wait for the app
            </Text>
          </View>
          <View style={styles.list}>
            {CALL_NOW.map((item) => (<View key={item} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text variant="body" style={styles.listText}>
                  {item}
                </Text>
              </View>
))}
          </View>
          <Button
            label="Call 995"
            variant="alert"
            fullWidth
            icon="medkit"
            onPress={callEmergency}
          />
        </Card>

        <Card key="limits" style={styles.limits}>
          <Overline>What this app will never do</Overline>
          <View style={styles.list}>
            {NEVER.map((item) => (<View key={item.id} style={styles.limitItem}>
                <Text variant="bodyStrong">{item.rule}</Text>
                <Text variant="callout" tone="muted">
                  {item.because}
                </Text>
              </View>
))}
          </View>
          <Text variant="caption" tone="faint">
            Everything the app suggests (the diet plan, the meal check, the stool check, the
            summary for your nurse) is built from what you have told it. None of it
            is a decision by your clinical team, and none of it changes what is on your
            appointment letter.
          </Text>
        </Card>
      </Stagger>
    </Screen>
);
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs },
  gapSm: { marginTop: spacing.xs },
  gapMd: { marginTop: spacing.md },
  callCard: { borderColor: colors.primary },
  emergency: { gap: spacing.md, borderColor: colors.alertSoft, backgroundColor: colors.alertSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { gap: spacing.sm },
  listItem: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.alert,
    marginTop: 9,
  },
  listText: { flex: 1 },
  limits: { gap: spacing.md },
  limitItem: { gap: 2 },
});
