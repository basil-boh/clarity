import { Ionicons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { colors, radius, shadow, spacing } from '@/theme';

import { usePressFeedback } from './motion';
import { Overline, Text } from './text';

export function Card({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

/**
 * A card that navigates. Kept distinct from `Card` so a tappable surface always
 * carries press feedback.
 *
 * The card styling lives on an inner `View`, not on the `Pressable`: `Link
 * asChild` clones its child and passes its own props down, which overwrites a
 * `style` set on the Pressable and silently strips the background off every
 * card with an href. The press state is a shared value rather than Pressable's
 * `pressed` render prop, so the release can spring back: the render prop flips
 * instantly in both directions, which reads as a flicker.
 */
export function PressableCard({
  children,
  href,
  onPress,
  style,
  padded = true,
  accessibilityLabel,
}: {
  children: ReactNode;
  href?: Href;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  accessibilityLabel?: string;
}) {
  const { press, pressStyle } = usePressFeedback();

  const body = (<Pressable
      onPress={onPress}
      onPressIn={() => {
        press.value = 1;
      }}
      onPressOut={() => {
        press.value = 0;
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.card, padded && styles.padded, style, pressStyle]}>
        {children}
      </Animated.View>
    </Pressable>
);

  if (!href) return body;

  return (<Link href={href} asChild>
      {body}
    </Link>
);
}

/** A titled block, optionally with a "see all" affordance. */
export function Section({
  title,
  action,
  actionHref,
  children,
  style,
}: {
  title: string;
  action?: string;
  actionHref?: Href;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (<View style={[styles.section, style]}>
      <View style={styles.sectionHeader}>
        <Overline>{title}</Overline>
        {action && actionHref ? (<Link href={actionHref} asChild>
            <Pressable hitSlop={8} accessibilityRole="link" style={styles.sectionAction}>
              <Text variant="caption" tone="primary">
                {action}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={colors.primary} />
            </Pressable>
          </Link>
) : null}
      </View>
      {children}
    </View>
);
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
  section: { gap: spacing.sm + 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
