import { Ionicons } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/views/components/icons';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

import { Text } from './text';

/**
 * A quiet inline row, not a card.
 *
 * Added because everything on every screen had become a white rounded
 * rectangle, and once every element carries the same weight, weight stops
 * meaning anything. A notice is for the things that must be *present* but must
 * not compete: the route to a person, a footnote, a nudge to a screen the
 * reader is not currently on.
 *
 * The safety route uses this rather than the card it used to be, and is more
 * findable for it: it now reads as a persistent affordance rather than as one
 * more block to scroll past.
 */
export function Notice({
  icon,
  title,
  detail,
  href,
  onPress,
  tone = 'quiet',
  style,
}: {
  icon: IconName;
  title: string;
  detail?: string;
  href?: Href;
  onPress?: () => void;
  tone?: 'quiet' | 'alert';
  style?: ViewStyle;
}) {
  const ink = tone === 'alert' ? colors.alert : colors.textMuted;
  const surface = tone === 'alert' ? colors.alertSoft : 'transparent';

  // The visual row lives on an inner `View`, not on the `Pressable`.
  // `Link asChild` clones its child and passes its own props down, which
  // overwrites a `style` set on the Pressable: the row loses its background,
  // its padding and its `flexDirection`, so the chevron drops onto its own
  // line. `PressableCard` documents the same trap; this component walked into
  // it, and the fix is the same.
  const body = (<Pressable
      onPress={onPress}
      accessibilityRole={href || onPress ? 'button' : undefined}
      accessibilityLabel={detail ? `${title}. ${detail}` : title}
    >
      {({ pressed }) => (<View
          style={[
            styles.row,
            { backgroundColor: surface },
            tone === 'quiet' && styles.quiet,
            pressed && styles.pressed,
            style,
          ]}
        >
          <Icon name={icon} size={19} color={ink} />
          <View style={styles.body}>
            <Text
              variant="bodyStrong"
              style={{ color: tone === 'alert' ? colors.alert : colors.text }}
            >
              {title}
            </Text>
            {detail ? (<Text variant="caption" tone="muted">
                {detail}
              </Text>
) : null}
          </View>
          {href || onPress ? (<Ionicons name="chevron-forward" size={17} color={colors.textFaint} />
) : null}
        </View>
)}
    </Pressable>
);

  if (!href) return body;
  return (<Link href={href} asChild>
      {body}
    </Link>
);
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.lg - 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  quiet: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  body: { flex: 1, gap: 1 },
  pressed: { opacity: 0.6 },
});
