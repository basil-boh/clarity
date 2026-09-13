import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, flag, radius, type FlagColour } from '@/theme';

import { Text } from './text';

type Tone = 'neutral' | 'primary' | 'alert';

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.cardSunken, fg: colors.textMuted },
  primary: { bg: colors.primarySoft, fg: colors.primaryDeep },
  alert: { bg: colors.alertSoft, fg: colors.alert },
};

export function Badge({
  label,
  tone = 'neutral',
  icon,
  filled = false,
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Solid rather than tinted. */
  filled?: boolean;
  style?: ViewStyle;
}) {
  const { bg, fg } = tones[tone];
  const surface = filled ? fg : bg;
  const ink = filled ? colors.textOnAccent : fg;

  return (
    <View style={[styles.badge, { backgroundColor: surface }, style]}>
      {icon ? <Ionicons name={icon} size={13} color={ink} /> : null}
      <Text variant="overline" style={{ color: ink }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The prep-readiness badge, and the only thing in the app allowed to wear
 * green, amber or red. See the note in `theme`.
 *
 * The label is never the bare colour. "Green" tells a patient nothing, and
 * worse, it invites them to read the flag as a grade they passed or failed;
 * every screen that shows it says what it actually means for the morning.
 */
const flagLabels: Record<FlagColour, string> = {
  green: 'On track',
  amber: 'Needs a check',
  red: 'Call the department',
};

const flagIcons: Record<FlagColour, keyof typeof Ionicons.glyphMap> = {
  green: 'checkmark-circle',
  amber: 'alert-circle',
  red: 'call',
};

export function FlagBadge({
  colour,
  label,
  style,
}: {
  colour: FlagColour;
  /** Overrides the default wording where a screen has something better to say. */
  label?: string;
  style?: ViewStyle;
}) {
  const { ink, tint } = flag[colour];

  return (
    <View style={[styles.badge, styles.flagBadge, { backgroundColor: tint }, style]}>
      <Ionicons name={flagIcons[colour]} size={15} color={ink} />
      <Text variant="caption" style={{ color: ink }}>
        {label ?? flagLabels[colour]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  flagBadge: { paddingHorizontal: 11, paddingVertical: 6 },
});
