import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors, radius } from '@/theme';

import { useScrolledIntoView } from './screen';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * How long a value takes to travel to its new position.
 *
 * Longer than the app's `motion.base`, on purpose. These two components are the
 * only place where the *change* is the information: on the purge night, a
 * patient records a glass and needs to see that it counted. A 220ms tick reads
 * as the number simply being different; ~520ms reads as the number moving, and
 * that difference is the whole feedback loop for the one task that decides the
 * outcome.
 */
const TRAVEL = 520;
const EASE = Easing.out(Easing.cubic);

/**
 * A radial progress ring with something in the middle.
 *
 * A linear bar is the wrong shape for the purge night. The bar this replaced
 * sat under a dose and read as a small progress widget among others; the night
 * has exactly one number that matters (how much of the preparation has
 * actually gone down) and a ring gives that number the whole centre of the
 * screen without a heading having to say it is important.
 *
 * Track and value are two circles rather than an arc path, because a
 * `strokeDasharray` on a full circle is exact at every fraction, whereas an arc
 * path has to pick a large-arc flag and gets it wrong at exactly 50%.
 */
export function ProgressRing({
  progress,
  size = 200,
  thickness = 14,
  track = colors.cardSunken,
  from = colors.primary,
  to,
  children,
}: {
  /** 0–1. Clamped, so a caller cannot overdraw the ring past a full turn. */
  progress: number;
  size?: number;
  thickness?: number;
  track?: string;
  from?: string;
  to?: string;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const clamped = Math.min(Math.max(progress, 0), 1);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;

  const shown = useSharedValue(clamped);

  useEffect(() => {
    shown.value = reduced ? clamped : withTiming(clamped, { duration: TRAVEL, easing: EASE });
  }, [clamped, reduced, shown]);

  const arc = useAnimatedProps(() => ({
    strokeDasharray: [circumference * shown.value, circumference],
    // Hidden rather than drawn at zero length: a round line cap on a zero-length
    // dash renders as a full bead, so an untouched ring showed a dot at twelve
    // o'clock that read as progress the patient had not made. Kept mounted so
    // the first glass animates *from* nothing instead of popping in.
    opacity: shown.value > 0.002 ? 1 : 0,
  }));

  return (<View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to ?? from} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={thickness} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ring)"
          strokeWidth={thickness}
          strokeLinecap="round"
          fill="none"
          animatedProps={arc}
          // Starts at twelve o'clock rather than three, which is where a reader
          // expects a clock-like thing to start.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centre} pointerEvents="box-none">
        {children}
      </View>
    </View>
);
}

/**
 * A short horizontal meter. The counterpart to the ring, for values being
 * compared against one another rather than owning the screen.
 *
 * The fill is animated as a **measured pixel width**, not a percentage string.
 * Reanimated interpolates numbers reliably and percentage strings unevenly, and
 * an animation that stutters on the one control a patient taps forty times in a
 * night is worse than no animation. The track reports its own width on layout,
 * so nothing has to be told how wide it is.
 *
 * The first fill waits until the meter has scrolled into view. The signal rows
 * on Today sit well below the fold, and filling on mount meant the travel had
 * finished before anyone scrolled down to it, so the bars simply appeared full.
 */
export function Meter({
  value,
  tint = colors.primary,
  track = colors.cardSunken,
  height = 8,
  /** Renders a dashed empty track, for a value that was never measured. */
  unmeasured = false,
}: {
  value: number;
  tint?: string;
  track?: string;
  height?: number;
  unmeasured?: boolean;
}) {
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const clamped = Math.min(Math.max(value, 0), 1);
  const { ref, onLayout: onSeenLayout, seen } = useScrolledIntoView();

  const shown = useSharedValue(0);

  useEffect(() => {
    const target = width * clamped;
    // Skipped until the track has been measured, otherwise the first frame
    // animates from zero to zero and the real value arrives without motion.
    // Held at zero until it is on screen, for the reason in the note above.
    if (width === 0 || !seen) return;
    shown.value = reduced ? target : withTiming(target, { duration: TRAVEL, easing: EASE });
  }, [clamped, width, reduced, shown, seen]);

  const fill = useAnimatedStyle(() => ({ width: shown.value }));

  function onLayout(event: LayoutChangeEvent) {
    onSeenLayout();
    const measured = event.nativeEvent.layout.width;
    if (measured !== width) setWidth(measured);
  }

  if (unmeasured) {
    // Carries the ref too, although it has nothing to animate: a meter that
    // flips from measured to unmeasured would otherwise leave the ref pointing
    // at a view that has gone.
    return (
      <Animated.View
        ref={ref}
        style={[styles.meter, styles.meterEmpty, { height }]}
        onLayout={onSeenLayout}
      />
    );
  }

  return (<Animated.View
      ref={ref}
      style={[styles.meter, { height, backgroundColor: track }]}
      onLayout={onLayout}
    >
      <Animated.View
        style={[{ height: '100%', borderRadius: radius.full, backgroundColor: tint }, fill]}
      />
    </Animated.View>
);
}

const styles = StyleSheet.create({
  centre: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meter: { borderRadius: radius.full, overflow: 'hidden' },
  meterEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
});
