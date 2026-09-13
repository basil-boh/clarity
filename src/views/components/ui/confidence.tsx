import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Text } from './text';

/**
 * How sure the model is, as a bar and a sentence.
 *
 * Shared between the meal check and the stool check because it is not really a
 * component: it is a promise. The gastroenterologist's condition for letting a
 * model near either of those screens was that nobody mistakes an estimate for a
 * finding, so no reading is ever rendered without one of these next to it.
 *
 * Never a bare percentage. "78%" reads as precision to a patient; a bar they
 * can see is two-thirds full, next to a plain-language qualifier, does not. The
 * second sentence is fixed rather than caller-supplied for the same reason a
 * disclaimer is not a prop: it should not be possible to render a confidence
 * without it.
 */
export function Confidence({ value }: { value: number }) {
  const label = value >= 0.85 ? 'fairly sure' : value >= 0.6 ? 'reasonably sure' : 'not very sure';
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (<View
      style={styles.confidence}
      accessible
      accessibilityLabel={`The app is ${label} about this. It is a suggestion, not a decision.`}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <Text variant="caption" tone="faint">
        The app is {label} about this. It is a suggestion, not a decision.
      </Text>
    </View>
);
}

const styles = StyleSheet.create({
  confidence: { gap: spacing.sm },
  track: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.cardSunken,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
});
