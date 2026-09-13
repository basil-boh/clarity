import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/views/components/icons';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

import { Text } from './text';

/**
 * A chip.
 *
 * The point of chips here is density with structure. The diet screen previously
 * rendered a food list as one run-on sentence joined with middots, which reads
 * as a paragraph and scans as nothing. Twelve chips occupy the same space and
 * let the eye land on one item.
 *
 * `struck` is how "leave out" is expressed. Colour alone would not do it: the
 * flag owns green and red, and a reader with a colour vision deficiency
 * scanning a food list at speed should not have to rely on hue for the one
 * distinction that matters.
 */
export function Chip({
  label,
  tone = 'neutral',
  struck = false,
  icon,
  style,
}: {
  label: string;
  tone?: 'neutral' | 'primary' | 'quiet';
  struck?: boolean;
  icon?: IconName;
  style?: ViewStyle;
}) {
  const surface =
    tone === 'primary' ? colors.primarySoft : tone === 'quiet' ? 'transparent' : colors.cardSunken;
  const ink = tone === 'primary' ? colors.primaryDeep : colors.textMuted;

  return (<View
      style={[
        styles.chip,
        { backgroundColor: surface },
        tone === 'quiet' && styles.chipOutlined,
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={13} color={ink} /> : null}
      <Text
        variant="caption"
        style={[{ color: ink }, struck && styles.struck]}
      >
        {label}
      </Text>
    </View>
);
}

/** A wrapping bed of chips. */
export function ChipBed({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.bed, style]}>{children}</View>;
}

export type TabOption = { key: string; label: string; icon?: IconName; ink?: string; tint?: string };

/**
 * A horizontally scrolling row of icon tabs.
 *
 * Chosen over a segmented control on purpose: a segmented control divides a
 * fixed width, so four Tamil labels either truncate or shrink the type below
 * legibility. A scrolling row degrades by scrolling, which is the failure mode
 * that costs nothing.
 */
export function TabRow({
  options,
  value,
  onChange,
  bleed = 0,
}: {
  options: readonly TabOption[];
  value: string;
  onChange: (key: string) => void;
  /** Cancels the page gutter so the row can run to the screen edge. */
  bleed?: number;
}) {
  return (<ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -bleed }}
      contentContainerStyle={{ paddingHorizontal: bleed, gap: spacing.sm }}
    >
      {options.map((option) => {
        const active = option.key === value;
        const ink = option.ink ?? colors.primary;
        const tint = option.tint ?? colors.primarySoft;

        return (<Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            style={[
              styles.tab,
              { backgroundColor: active ? tint : colors.card },
              active ? { borderColor: ink } : { borderColor: colors.border },
            ]}
          >
            {option.icon ? (<Icon name={option.icon} size={17} color={active ? ink : colors.textFaint} />
) : null}
            <Text variant="caption" style={{ color: active ? ink : colors.textMuted }}>
              {option.label}
            </Text>
          </Pressable>
);
      })}
    </ScrollView>
);
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  chipOutlined: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
  struck: { textDecorationLine: 'line-through' },
  bed: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm - 2 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: MIN_TOUCH - 8,
    paddingHorizontal: spacing.lg - 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
});
