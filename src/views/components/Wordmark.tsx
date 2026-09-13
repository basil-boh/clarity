import { useEffect } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { palette } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The lockup: the mark, then "larity", drawn by a pen.
 *
 * The mark already is a C, so it stands in as the word's first letter rather
 * than sitting beside a redundant one.
 *
 * ── Everything here is a stroke ────────────────────────────────────────────
 *
 * Which is the point. Drawing a *filled* letterform means recovering its
 * centreline, stroking that into a mask and animating the mask: a
 * skeletonisation pipeline, per-run widths from a distance transform, and 138
 * animated paths. These letters are monoline by construction, so the stroke is
 * not a stand-in for the letter, it *is* the letter. `strokeDashoffset` on
 * 13 paths, no masks, nothing to go wrong at a junction.
 *
 * The letters are drawn rather than set in Inter: the mark is monoline geometry
 * with round terminals, and a text face beside it reads as two unrelated things
 * placed near each other. x-height, stroke weight and cap shape all come off
 * the mark.
 *
 * ── Two details worth keeping ──────────────────────────────────────────────
 *
 * `AppLogo` draws its body as a filled annular sector, which cannot be
 * stroke-animated. The first path below is that sector's centreline: radius
 * 33.5, band 15, the same 48 degrees to -48 the long way round, butt caps so
 * the terminals stay radial. Verified against the filled original pixel for
 * pixel, agreeing to 0.09%. **If the mark changes in `AppLogo`, regenerate this
 * rather than nudging it.**
 *
 * The 'a' is a closed circle drawn as two half arcs, with its stem centred on
 * the circle's rightmost point. Both halves of that matter: an earlier version
 * used a single near-360 degree arc stopping 0.01 units short of its own start,
 * with the stem pulled three units inboard to force a join, and the resulting
 * hairline notch sat outside the stem and read as a lump on the letter.
 *
 * Body and echo sweep together rather than in turn, because they are the same
 * curve stated twice. The echo is longer, so it sets the window and the body
 * lands fractionally early, which reads as one movement trailing its hairline.
 */

const VIEW_BOX = '18 6 377.40 132';
const RATIO = 2.8591;
/** Seconds for the whole lockup. */
const TOTAL = 1.164;

type Stroke = { d: string; w: number; cap: 'butt' | 'round'; len: number; t0: number; dur: number };

/**
 * The first two strokes are the mark — the body's centreline and its echo — and
 * everything after them is "larity". `markColor` splits on that boundary, so the
 * mark can take the brand colour while the letters reverse to white.
 */
const MARK_STROKES = 2;

const STROKES: Stroke[] = [
  { d: 'M92.42 35.10 A33.5 33.5 0 1 0 92.42 84.90', w: 15, cap: 'butt', len: 154.34, t0: 0.0, dur: 0.3035 },
  { d: 'M97.53 20.68 A48 48 0 1 0 97.53 99.32', w: 5, cap: 'round', len: 209.44, t0: 0.0, dur: 0.3035 },
  { d: 'M126.50 22.00 L126.50 101.00', w: 13, cap: 'round', len: 79.0, t0: 0.3035, dur: 0.1145 },
  { d: 'M194.50 79.50 A21.5 21.5 0 1 1 151.50 79.50 A21.5 21.5 0 1 1 194.50 79.50', w: 13, cap: 'round', len: 135.09, t0: 0.418, dur: 0.1958 },
  { d: 'M194.50 58.00 L194.50 101.00', w: 13, cap: 'round', len: 43.0, t0: 0.6138, dur: 0.0623 },
  { d: 'M219.50 58.00 L219.50 101.00', w: 13, cap: 'round', len: 43.0, t0: 0.6761, dur: 0.0623 },
  { d: 'M219.50 74.00 A16 16 0 0 1 239.91 58.62', w: 13, cap: 'round', len: 29.6, t0: 0.7384, dur: 0.0429 },
  { d: 'M264.90 58.00 L264.90 101.00', w: 13, cap: 'round', len: 43.0, t0: 0.7813, dur: 0.0623 },
  { d: 'M264.90 39.00 L264.90 39.60', w: 13, cap: 'round', len: 0.6, t0: 0.8437, dur: 0.0009 },
  { d: 'M300.90 28.00 L300.90 90.00 A11 11 0 0 0 311.90 101.00', w: 13, cap: 'round', len: 79.28, t0: 0.8445, dur: 0.1149 },
  { d: 'M289.90 58.00 L315.90 58.00', w: 13, cap: 'round', len: 26.0, t0: 0.9594, dur: 0.0377 },
  { d: 'M340.90 58.00 L357.90 95.00', w: 13, cap: 'round', len: 40.72, t0: 0.9971, dur: 0.059 },
  { d: 'M374.90 58.00 L349.90 128.00', w: 13, cap: 'round', len: 74.33, t0: 1.0561, dur: 0.1077 },
];

export function Wordmark({
  size = 240,
  delay = 0,
  active = true,
  animate = true,
  color = palette.blue,
  markColor = color,
}: {
  /** Rendered width. The height follows the lockup's own proportions. */
  size?: number;
  delay?: number;
  active?: boolean;
  /**
   * Draws the lockup on. Off for the copies that sit at the top of the app's
   * own pages: those are a signature, and a signature that redraws itself every
   * time a tab is focused is a distraction on a screen someone opened to do
   * something else.
   */
  animate?: boolean;
  color?: string;
  /** The mark alone, when it should differ from the letters. Defaults to `color`. */
  markColor?: string;
}) {
  const reduced = useReducedMotion();
  /** One clock, in seconds, so the pen never changes speed. */
  const clock = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      clock.value = TOTAL;
      lift.value = 1;
      return;
    }
    if (!active) {
      clock.value = 0;
      lift.value = 0;
      return;
    }
    clock.value = 0;
    // Linear: a pen does not ease.
    clock.value = withDelay(delay, withTiming(TOTAL, { duration: TOTAL * 1000, easing: Easing.linear }));
    lift.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, [active, reduced, delay, clock, lift]);

  const rise = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(lift.value, [0, 1], [8, 0]) }],
  }));

  // Static: plain paths, no clock, no worklets. Not the animated component held
  // at the end, which would keep thirteen shared values ticking on every screen
  // that shows the signature.
  if (!animate) {
    return (
      <Svg width={size} height={size / RATIO} viewBox={VIEW_BOX} accessibilityLabel="Clarity">
        {STROKES.map((stroke, i) => (
          <Path
            key={stroke.d}
            d={stroke.d}
            stroke={i < MARK_STROKES ? markColor : color}
            strokeWidth={stroke.w}
            fill="none"
            strokeLinecap={stroke.cap}
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    );
  }

  return (
    <Animated.View style={[{ width: size, height: size / RATIO }, rise]} accessibilityLabel="Clarity">
      <Svg width={size} height={size / RATIO} viewBox={VIEW_BOX}>
        {STROKES.map((stroke, i) => (
          <Pen
            key={stroke.d}
            clock={clock}
            stroke={stroke}
            color={i < MARK_STROKES ? markColor : color}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

function Pen({
  clock,
  stroke,
  color,
}: {
  clock: SharedValue<number>;
  stroke: Stroke;
  color: string;
}) {
  const props = useAnimatedProps(() => {
    const progress = Math.min(Math.max((clock.value - stroke.t0) / stroke.dur, 0), 1);
    return {
      strokeDashoffset: stroke.len * (1 - progress),
      // A round cap on a zero-length dash renders a full dot, which would show
      // a bead of every undrawn stroke from the first frame.
      opacity: progress > 0.001 ? 1 : 0,
    };
  });

  return (
    <AnimatedPath
      d={stroke.d}
      stroke={color}
      strokeWidth={stroke.w}
      fill="none"
      strokeLinecap={stroke.cap}
      strokeLinejoin="round"
      strokeDasharray={stroke.len}
      animatedProps={props}
    />
  );
}
