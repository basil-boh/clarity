import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { palette, radius, shadow, spacing } from '@/theme';

import { Text } from './text';

/**
 * The dark panel at the top of a screen.
 *
 * One per screen, at most, and it is the thing the reader looks at first. It
 * exists because a page of white cards has no top: every block competes
 * equally and the eye starts wherever it happens to land. An inverted panel
 * settles that in one move, without a heading having to announce itself.
 *
 * The two soft blobs behind the content are doing real work: a flat navy
 * rectangle reads as a disabled state, and the gradient is what makes it read
 * as a surface. They are SVG rather than a gradient library because both are
 * already paid for by `react-native-svg`.
 */
export function Hero({
  eyebrow,
  children,
  style,
  tone = 'night',
  aside,
  footer,
}: {
  eyebrow?: string;
  children: ReactNode;
  style?: ViewStyle;
  tone?: 'night' | 'primary';
  /**
   * A column down the panel's right edge, beside everything else rather than
   * over it.
   *
   * This was absolutely positioned while the aside was a single small mark and
   * the corner it sat in was empty. It is real layout now because the aside grew
   * into a stack of three: an absolute box that tall silently overlaps the
   * heading and the footer, and no amount of per-row padding on the screen's
   * side keeps up with it. A row costs the panel some width and gives back the
   * guarantee that nothing can ever collide.
   */
  aside?: ReactNode;
  /**
   * Full width, below the split.
   *
   * Anything long belongs here rather than in `children`. The aside is a column
   * down the right, so it takes its width out of everything beside it, and a
   * line like "Arrive 07:30 · Block 3, Level 4" wraps in what is left. Below the
   * aside there is nothing to avoid and the whole panel is available.
   */
  footer?: ReactNode;
}) {
  const base = tone === 'night' ? palette.night : palette.blueDeep;
  const glow = tone === 'night' ? '#3A4BA8' : '#7C93FF';

  const body = (
    <>
      {eyebrow ? (<Text variant="overline" style={styles.eyebrow}>
          {eyebrow.toUpperCase()}
        </Text>
) : null}
      {children}
    </>
  );

  return (<View style={[styles.hero, { backgroundColor: base }, style]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="hero-a" cx="18%" cy="0%" r="72%">
              <Stop offset="0" stopColor={glow} stopOpacity="0.55" />
              <Stop offset="1" stopColor={glow} stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="hero-b" cx="96%" cy="100%" r="66%">
              <Stop offset="0" stopColor={glow} stopOpacity="0.32" />
              <Stop offset="1" stopColor={glow} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="10%" cy="0%" r="180" fill="url(#hero-a)" />
          <Circle cx="100%" cy="100%" r="150" fill="url(#hero-b)" />
        </Svg>
      </View>

      {aside ? (<View style={styles.split}>
          <View style={styles.main}>{body}</View>
          <View pointerEvents="none">{aside}</View>
        </View>
) : (
        body
      )}

      {footer}
    </View>
);
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius['2xl'],
    padding: spacing['2xl'],
    gap: spacing.sm,
    overflow: 'hidden',
    ...shadow.raised,
  },
  eyebrow: { color: 'rgba(255,255,255,0.62)' },
  split: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  // The panel's own `gap` spaced the eyebrow off the content when both were its
  // direct children. They are nested now, so the column carries that gap.
  main: { flex: 1, gap: spacing.sm },
});
