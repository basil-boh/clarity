import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Text } from './text';

/**
 * A vertical timeline: a rail, a node per entry, and content beside it.
 *
 * This replaces the "stack of cards, each with a time label" pattern that the
 * Today and Prep-night screens both used. The rail is the whole difference:
 * cards in a column are a *set*, and the reader has to work out that they are
 * ordered; a connected rail is a *sequence*, and the order is the first thing
 * you see. On a screen whose entire subject is doing things in the right order,
 * that is not decoration.
 *
 * The rail is drawn per row rather than as one absolutely positioned line, so
 * rows of different heights stay connected without anyone measuring anything.
 */
export function Timeline({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={style}>{children}</View>;
}

export function TimelineRow({
  time,
  title,
  detail,
  state = 'upcoming',
  accent,
  last = false,
  trailing,
  children,
  dark = false,
}: {
  /** Wall clock, or null for "some time today". */
  time?: string | null;
  title: string;
  detail?: string;
  /** `now` is the one the reader should act on; there should be at most one. */
  state?: 'done' | 'now' | 'upcoming';
  accent?: string;
  last?: boolean;
  trailing?: ReactNode;
  /** Controls belonging to this step, drawn inside the rail's column. */
  children?: ReactNode;
  dark?: boolean;
}) {
  const tint = accent ?? colors.primary;
  const railColour = dark ? 'rgba(255,255,255,0.16)' : colors.border;
  const inkStrong = dark ? '#EDEFF6' : colors.text;
  const inkMuted = dark ? '#A2A9BC' : colors.textMuted;
  const inkFaint = dark ? '#A2A9BC' : colors.textFaint;

  return (<View style={styles.row}>
      <View style={styles.rail}>
        <View
          style={[
            styles.node,
            state === 'done' && { backgroundColor: tint, borderColor: tint },
            state === 'now' && { borderColor: tint, borderWidth: 4, backgroundColor: dark ? '#10131C' : colors.card },
            state === 'upcoming' && { borderColor: railColour, backgroundColor: 'transparent' },
          ]}
        />
        {!last ? <View style={[styles.line, { backgroundColor: railColour }]} /> : null}
      </View>

      <View style={[styles.content, last && styles.contentLast]}>
        <View style={styles.head}>
          {time ? (<Text variant="caption" style={{ color: state === 'now' ? tint : inkFaint }}>
              {time}
            </Text>
) : (<Text variant="caption" style={{ color: inkFaint }}>
              Any time
            </Text>
)}
          {trailing}
        </View>
        <Text variant="bodyStrong" style={{ color: inkStrong }}>
          {title}
        </Text>
        {detail ? (<Text variant="callout" style={{ color: inkMuted }}>
            {detail}
          </Text>
) : null}
        {children ? <View style={styles.children}>{children}</View> : null}
      </View>
    </View>
);
}

const NODE = 14;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  rail: { width: NODE, alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: radius.full,
    borderWidth: 2,
    marginTop: 4,
  },
  line: { width: 2, flex: 1, marginTop: 4, borderRadius: 1 },
  content: { flex: 1, gap: 2, paddingBottom: spacing.xl },
  contentLast: { paddingBottom: 0 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  children: { marginTop: spacing.md },
});
