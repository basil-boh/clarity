import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { colors } from '@/theme';

/**
 * The five pieces of artwork behind the welcome tour.
 *
 * Each one is a small scene rather than an icon: a plated meal under a camera
 * frame, a night sky with an answer arriving, a glass filling against a
 * progress ring, a summary card assembling itself, a shield with the two things
 * it refuses to do. They are built from filled forms with gradients and cast
 * shadows, not hairlines, because five thin line drawings in one accent read as
 * a wireframe no matter how well each is drawn.
 *
 * Four structural rules keep it robust:
 *
 * 1. **Every gradient and clip id is namespaced per scene** (`s1…`, `s2…`).
 *    All five illustrations are mounted at once inside the pager. On native
 *    each `<Svg>` is its own render tree so ids are local, but on web they all
 *    land in one document and a duplicate id silently makes two scenes share a
 *    fill. Prefixing is the only reason this survives `--platform web`.
 * 2. Anything that **draws** animates `strokeDashoffset` against a static
 *    `strokeDasharray`, the one universally supported way to reveal a stroke.
 * 3. Anything that **loops** stops when the slide is not active. Five off-screen
 *    loops are five timers running for nothing.
 * 4. Anything that **moves within the 200×200 grid** animates its own SVG
 *    attribute (`y`, `cy`, `width`, `d`) rather than transforming a wrapping
 *    view, because a view translates in screen points and the grid is scaled.
 *
 * Every hook checks `useReducedMotion()`. With motion off the art is not
 * degraded: it simply arrives fully assembled.
 */

/**
 * The largest the artwork is ever drawn, and the smallest gutter it keeps.
 *
 * Every scene draws into a 200×200 grid and every `<Svg>` is sized at 100%, so
 * the art is resolution-independent: the *caller* owns the box and the grid
 * scales into it. `artSizeFor` is how the tour picks that box: as large as the
 * screen allows, capped, so a 320pt SE keeps a gutter and a 430pt Pro Max does
 * not leave the illustration stranded in the middle of the page.
 */
export const ART_MAX = 320;
const ART_GUTTER = 26;

export function artSizeFor(screenWidth: number) {
  return Math.min(screenWidth - ART_GUTTER * 2, ART_MAX);
}

const VIEW_BOX = '0 0 200 200';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_SOFT = Easing.inOut(Easing.quad);
const SPRING = { damping: 14, stiffness: 150, mass: 0.8 } as const;

/**
 * The illustration palette.
 *
 * Deliberately wider than the UI tokens, and deliberately separate from them.
 * The interface is disciplined to ink, one blue, and a reserved green/amber/red
 * for the prep flag: a rule that exists so the flag stays a signal. Artwork is
 * not a signal, and holding illustration to the same three colours is what made
 * the first pass look like five diagrams of the same thing.
 *
 * `blue` is the app's own primary, so the art and the interface still agree.
 * The warm side (`sand`, `peach`, `cream`) is what stops it reading cold; it is
 * only ever used on illustrative objects (a moon, a bowl of rice, a slash
 * through a bottle) never on anything shaped like a status.
 *
 * The one exception is the green pill inside the summary card on slide four:
 * that is not a decorative choice, it is the flag itself, so it uses the real
 * flag tokens.
 */
const ART = {
  indigo: '#1B2A6B',
  blue: colors.primary,
  peri: '#7C93FF',
  sky: '#B9C8FF',
  mist: '#E4EAFF',
  sand: '#FFCE8F',
  peach: '#FF9B77',
  cream: '#FFF3E4',
  violet: '#A78BFA',
  white: '#FFFFFF',
  // The fillet's edge and the darker strip along its back.
  fishEdge: '#E8825F',
  fishSkin: '#D9694A',
  // The flag, on slide four only.
  flagInk: '#0A7A4E',
  flagTint: '#DDF1E7',
} as const;

export type IllustrationProps = { active: boolean };

// ---------------------------------------------------------------------------
// Motion helpers
// ---------------------------------------------------------------------------

/**
 * Reveals a stroked shape by walking its dash offset back to zero.
 *
 * `length` only has to be a close overestimate of the real path length: too
 * short and the tail never lands, too long and the stroke finishes drawing a
 * little before the timer does.
 */
function useDrawOn(active: boolean, length: number, delay = 0, duration = 900) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EASE_OUT }));
  }, [active, reduced, delay, duration, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  return { animatedProps, strokeDasharray: length };
}

/** Fades a fill in behind the shapes that describe it. */
function useFadeIn(active: boolean, delay: number, to = 1, duration = 600) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      opacity.value = to;
      return;
    }
    if (!active) {
      opacity.value = 0;
      return;
    }
    opacity.value = withDelay(delay, withTiming(to, { duration, easing: EASE_OUT }));
  }, [active, reduced, delay, to, duration, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

/**
 * An object arriving with weight: it overshoots slightly and settles.
 *
 * This is what most of the new artwork is built on, and it is the main reason
 * the scenes feel assembled rather than faded in.
 */
function usePopIn(active: boolean, delay: number, from = 0.7) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, SPRING));
  }, [active, reduced, delay, progress]);

  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [from, 1]) }],
  }));
}

/** An object sliding into place from a direction, then settling. */
function useSlideIn(active: boolean, delay: number, dx: number, dy: number) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(delay, withSpring(1, SPRING));
  }, [active, reduced, delay, progress]);

  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0, 1, 1]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [dx, 0]) },
      { translateY: interpolate(progress.value, [0, 1], [dy, 0]) },
    ],
  }));
}

/** A 0 → 1 → 0 loop. The generic "something is alive here" driver. */
function useOscillation(active: boolean, duration: number, delay = 0): SharedValue<number> {
  const reduced = useReducedMotion();
  const value = useSharedValue(0);

  useEffect(() => {
    if (reduced || !active) {
      cancelAnimation(value);
      value.value = 0;
      return;
    }
    value.value = withDelay(delay,
      withRepeat(withTiming(1, { duration, easing: EASE_SOFT }), -1, true),
);
    return () => cancelAnimation(value);
  }, [active, reduced, duration, delay, value]);

  return value;
}

/** A continuous 0 → 1 ramp that restarts, for anything that travels. */
function useTravel(active: boolean, duration: number, delay = 0): SharedValue<number> {
  const reduced = useReducedMotion();
  const value = useSharedValue(0);

  useEffect(() => {
    if (reduced || !active) {
      cancelAnimation(value);
      value.value = 0;
      return;
    }
    value.value = 0;
    value.value = withDelay(delay,
      withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false),
);
    return () => cancelAnimation(value);
  }, [active, reduced, duration, delay, value]);

  return value;
}

/** A value that eases once from 0 to 1 and stays there. */
function useOnce(active: boolean, delay: number, duration: number): SharedValue<number> {
  const reduced = useReducedMotion();
  const value = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      value.value = 1;
      return;
    }
    if (!active) {
      value.value = 0;
      return;
    }
    value.value = withDelay(delay, withTiming(1, { duration, easing: EASE_OUT }));
  }, [active, reduced, delay, duration, value]);

  return value;
}

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

/** One stacked SVG canvas, so layers can be transformed independently. */
function Layer({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: Parameters<typeof Animated.View>[0]['style'];
}) {
  return (<Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
        {children}
      </Svg>
    </Animated.View>
);
}

/**
 * The halo every scene sits on, plus the whole frame settling in.
 *
 * `id` is required rather than defaulted: see rule 1 at the top of the file.
 */
function Frame({
  active,
  id,
  tint = ART.peri,
  children,
}: {
  active: boolean;
  id: string;
  tint?: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const entrance = useSharedValue(0);
  const breath = useOscillation(active, 4400);

  useEffect(() => {
    if (reduced) {
      entrance.value = 1;
      return;
    }
    if (!active) {
      entrance.value = 0;
      return;
    }
    entrance.value = withSpring(1, { damping: 18, stiffness: 120, mass: 1 });
  }, [active, reduced, entrance]);

  const frameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.4, 1], [0, 1, 1]),
    transform: [{ scale: interpolate(entrance.value, [0, 1], [0.92, 1]) }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [1, 1.05]) }],
    opacity: interpolate(breath.value, [0, 1], [0.82, 1]),
  }));

  return (<Animated.View style={[styles.frame, frameStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, haloStyle]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
          <Defs>
            <RadialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={tint} stopOpacity="0.26" />
              <Stop offset="1" stopColor={tint} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="94" fill={`url(#${id}-halo)`} />
        </Svg>
      </Animated.View>
      {children}
    </Animated.View>
);
}

/** A cast shadow. SVG filters are unreliable here, so it is a flat ellipse. */
function Shadow({
  cx,
  cy,
  rx,
  ry,
  opacity = 0.13,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  opacity?: number;
}) {
  return <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={ART.indigo} opacity={opacity} />;
}

/** An arc path between two clock angles, 0 being twelve o'clock. */
function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const point = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r] as const;
  };
  const [x0, y0] = point(from);
  const [x1, y1] = point(to);
  const large = (to - from + 360) % 360 > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1 · The plate, from above, under a camera frame
// ═══════════════════════════════════════════════════════════════════════════

/** Scattered grains on the rice mound. Hand-placed; a random scatter clumps. */
const GRAINS = [
  { x: 70, y: 92, rotate: -18 },
  { x: 79, y: 85, rotate: 12 },
  { x: 88, y: 93, rotate: -8 },
  { x: 74, y: 99, rotate: 26 },
  { x: 86, y: 86, rotate: -32 },
  { x: 82, y: 97, rotate: 6 },
  { x: 92, y: 88, rotate: 20 },
];

/**
 * Slide one: the diet plan, and the meal check over the top of it.
 *
 * The plate lands, then rice, fish and egg drop into it one after another, and
 * only then does the camera frame close around it and sweep. That order is the
 * argument of features 03 and 04 in about two seconds: the plan comes first and
 * is built for you; the photograph is how you check yourself against it.
 *
 * The three portions are the ones the diet screen actually permits. See the
 * note beside them.
 */
export function DietPlate({ active }: IllustrationProps) {
  const plate = usePopIn(active, 120, 0.82);
  const rice = usePopIn(active, 420, 0.4);
  const fish = usePopIn(active, 540, 0.4);
  const egg = usePopIn(active, 660, 0.4);
  const brackets = useDrawOn(active, 60, 820, 620);
  const badge = usePopIn(active, 1600, 0.3);

  // The beam sweeps the plate, pauses, and sweeps again.
  const sweep = useTravel(active, 3600, 1100);
  const beamCore = useAnimatedProps(() => ({
    y: interpolate(sweep.value, [0, 0.6, 1], [46, 152, 152]),
    opacity: interpolate(sweep.value, [0, 0.08, 0.55, 0.68, 1], [0, 0.9, 0.9, 0, 0]),
  }));
  const beamGlow = useAnimatedProps(() => ({
    y: interpolate(sweep.value, [0, 0.6, 1], [39, 145, 145]),
    opacity: interpolate(sweep.value, [0, 0.08, 0.55, 0.68, 1], [0, 0.18, 0.18, 0, 0]),
  }));

  // The portions breathe very slightly, at different phases, so the plate is
  // never completely dead between sweeps.
  const drift = useOscillation(active, 3800);
  const driftA = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(drift.value, [0, 1], [0, -2.5]) }],
  }));
  const driftB = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(drift.value, [0, 1], [-2, 1]) }],
  }));

  const glow = useOscillation(active, 2400, 1800);
  const badgeGlow = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.05]) }],
  }));

  return (<Frame active={active} id="s1">
      <Layer>
        <Circle cx="60" cy="56" r="30" fill={ART.cream} opacity={0.95} />
        <Circle cx="150" cy="152" r="26" fill={ART.mist} opacity={0.9} />
      </Layer>

      {/* the plate */}
      <Layer style={plate}>
        <Defs>
          <LinearGradient id="s1-face" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ART.white} />
            <Stop offset="1" stopColor="#EFF3FF" />
          </LinearGradient>
        </Defs>
        <Shadow cx={100} cy={118} rx={54} ry={46} opacity={0.1} />
        <Circle cx="100" cy="102" r="56" fill="url(#s1-face)" />
        <Circle cx="100" cy="102" r="56" fill="none" stroke={ART.mist} strokeWidth={3.5} />
        <Circle cx="100" cy="102" r="43" fill="none" stroke={ART.mist} strokeWidth={1.8} />
      </Layer>

      {/*
        The meal itself: steamed rice, a fillet of fish, a halved boiled egg.

        Those three are not a generic plate. They are what the app's own diet
        screen puts on the "you can have" list (white rice, steamed fish,
        eggs) and the first version of this drawing showed leafy greens, which
        that same screen lists under "leave out". An illustration that
        contradicts the advice two taps away is worse than a plain one.

        Each portion lands on its own beat and then breathes. The entrance and
        the ambient drift are separate views rather than one combined style:
        they are driven by different clocks (a spring that fires once, and a
        loop that never stops) and composing both transforms in a single
        `useAnimatedStyle` would make the loop fight the spring's settle for
        the first half-second.
      */}
      <Animated.View style={[StyleSheet.absoluteFill, rice]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, driftA]}>
          <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
            <Defs>
              <LinearGradient id="s1-rice" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={ART.white} />
                <Stop offset="1" stopColor="#FFEBD0" />
              </LinearGradient>
            </Defs>
            <Ellipse cx="80" cy="103" rx="22" ry="5" fill={ART.indigo} opacity={0.07} />
            <Path
              d="M58 101 q0 -16 10 -23 q12 -8 23 -1 q11 7 11 24 q-22 6 -44 0 z"
              fill="url(#s1-rice)"
              stroke={ART.sand}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            {GRAINS.map((grain) => (<Rect
                key={`${grain.x}-${grain.y}`}
                x={grain.x - 3.2}
                y={grain.y - 1.3}
                width="6.4"
                height="2.6"
                rx="1.3"
                fill={ART.sand}
                opacity={0.5}
                transform={`rotate(${grain.rotate} ${grain.x} ${grain.y})`}
              />
))}
          </Svg>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, fish]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, driftB]}>
          <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
            <Defs>
              <LinearGradient id="s1-fish" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFF1E8" />
                <Stop offset="1" stopColor={ART.peach} />
              </LinearGradient>
            </Defs>
            {/* Scaled and nudged inboard so the tail stays on the plate: the
                tip lands 51 units from the plate centre, inside its radius of
                56. Anything larger and the fish hangs off the rim. */}
            <G transform="translate(-9 -1) scale(0.94) translate(7 6)">
              <Ellipse cx="126" cy="104" rx="20" ry="4.5" fill={ART.indigo} opacity={0.07} />
              <Path d="M146 88 l12 -8 v20 z" fill={ART.peach} opacity={0.85} />
              <Path
                d="M104 94 q6 -16 24 -16 q18 0 22 14 q-4 14 -22 14 q-18 0 -24 -12 z"
                fill="url(#s1-fish)"
                stroke={ART.fishEdge}
                strokeWidth={1.8}
                strokeLinejoin="round"
              />
              {/* The dark strip along the back is the cue that makes a rounded
                  shape read as a fillet rather than as a bread roll. */}
              <Path
                d="M106 90 q7 -13 23 -13 q16 0 20 11"
                stroke={ART.fishSkin}
                strokeWidth={3.2}
                fill="none"
                strokeLinecap="round"
              />
              {[0, 1, 2, 3].map((i) => (<Path
                  key={i}
                  d={`M${110 + i * 8} 84 q3.5 8 0.5 16`}
                  stroke={ART.fishEdge}
                  strokeWidth={1.5}
                  fill="none"
                  opacity={0.55}
                  strokeLinecap="round"
                />
))}
            </G>
          </Svg>
        </Animated.View>
      </Animated.View>

      <Layer style={egg}>
        <Defs>
          <LinearGradient id="s1-yolk" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFDCA6" />
            <Stop offset="1" stopColor={ART.sand} />
          </LinearGradient>
        </Defs>
        {[
          { cx: 93, cy: 129 },
          { cx: 116, cy: 130 },
        ].map((half) => (<G key={half.cx}>
            <Ellipse
              cx={half.cx}
              cy={half.cy}
              rx="14"
              ry="10.5"
              fill={ART.white}
              stroke={ART.mist}
              strokeWidth={1.8}
            />
            <Ellipse cx={half.cx} cy={half.cy} rx="6" ry="4.8" fill="url(#s1-yolk)" />
          </G>
))}
      </Layer>

      {/* the camera frame, closing around the plate */}
      <Layer>
        <Defs>
          <LinearGradient id="s1-beam" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={ART.blue} stopOpacity="0" />
            <Stop offset="0.5" stopColor={ART.blue} stopOpacity="0.9" />
            <Stop offset="1" stopColor={ART.blue} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[
          'M38 64 L38 46 A8 8 0 0 1 46 38 L64 38',
          'M136 38 L154 38 A8 8 0 0 1 162 46 L162 64',
          'M162 140 L162 158 A8 8 0 0 1 154 166 L136 166',
          'M64 166 L46 166 A8 8 0 0 1 38 158 L38 140',
        ].map((d) => (<AnimatedPath
            key={d}
            d={d}
            stroke={ART.blue}
            strokeWidth={4.4}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={brackets.strokeDasharray}
            animatedProps={brackets.animatedProps}
          />
))}
        <AnimatedRect
          x="42"
          width="116"
          height="16"
          rx="8"
          fill="url(#s1-beam)"
          animatedProps={beamGlow}
        />
        <AnimatedRect
          x="42"
          width="116"
          height="2.2"
          rx="1.1"
          fill="url(#s1-beam)"
          animatedProps={beamCore}
        />
      </Layer>

      {/* the verdict */}
      <Animated.View style={[StyleSheet.absoluteFill, badge]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, badgeGlow]}>
          <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
            <Defs>
              <LinearGradient id="s1-tick" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={ART.peri} />
                <Stop offset="1" stopColor={ART.blue} />
              </LinearGradient>
            </Defs>
            <Circle cx="152" cy="150" r="25" fill={ART.white} />
            <Circle cx="152" cy="150" r="19.5" fill="url(#s1-tick)" />
            <Path
              d="M144 150 l6 6 12 -13"
              stroke={ART.white}
              strokeWidth={3.6}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Frame>
);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2 · The night, and an answer arriving
// ═══════════════════════════════════════════════════════════════════════════

const STARS = [
  { x: 74, y: 58, r: 2.4, o: 0.95, phase: 0 },
  { x: 126, y: 50, r: 1.9, o: 0.7, phase: 600 },
  { x: 142, y: 78, r: 2.7, o: 1, phase: 1200 },
  { x: 64, y: 92, r: 1.6, o: 0.5, phase: 300 },
  { x: 108, y: 66, r: 1.5, o: 0.6, phase: 900 },
  { x: 136, y: 110, r: 2, o: 0.55, phase: 1500 },
  { x: 58, y: 120, r: 1.8, o: 0.45, phase: 450 },
  { x: 96, y: 44, r: 2.1, o: 0.8, phase: 1050 },
];

/** The lit stretch: six in the evening round to two in the morning. */
const NIGHT_FROM = 180;
const NIGHT_TO = 66;
const RING_R = 86;

/**
 * Slide two: the 24/7 chatbot.
 *
 * The ring is the clock. The pale stretch is the part of the day somebody can
 * be reached; the warm stretch, from six in the evening round to two, is when
 * the preparation actually happens and no department answers. A marker crawls
 * that stretch continuously, the sky fills with stars, and an answer arrives
 * anyway.
 */
export function NightHours({ active }: IllustrationProps) {
  const dayArc = useDrawOn(active, 2 * Math.PI * RING_R, 120, 800);
  const nightArc = useDrawOn(active, 2 * Math.PI * RING_R, 420, 1100);
  const sky = usePopIn(active, 260, 0.86);
  const moon = usePopIn(active, 780, 0.4);
  const card = useSlideIn(active, 1150, 0, 26);

  const bob = useOscillation(active, 2800, 1600);
  const cardBob = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bob.value, [0, 1], [0, -5]) }],
  }));

  // The marker crawls the warm stretch, over and over.
  const crawl = useTravel(active, 9000, 1200);
  const markerProps = useAnimatedProps(() => {
    const span = (NIGHT_TO - NIGHT_FROM + 360) % 360;
    const angle = NIGHT_FROM + crawl.value * span;
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      cx: 100 + Math.cos(rad) * RING_R,
      cy: 100 + Math.sin(rad) * RING_R,
    };
  });

  return (<Frame active={active} id="s2">
      {/* the clock */}
      <Layer>
        <AnimatedPath
          d={arcPath(100, 100, RING_R, NIGHT_TO, NIGHT_FROM)}
          stroke={ART.sky}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          opacity={0.5}
          strokeDasharray={dayArc.strokeDasharray}
          animatedProps={dayArc.animatedProps}
        />
        <AnimatedPath
          d={arcPath(100, 100, RING_R, NIGHT_FROM, NIGHT_TO)}
          stroke={ART.sand}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={nightArc.strokeDasharray}
          animatedProps={nightArc.animatedProps}
        />
      </Layer>

      {/* the night itself */}
      <Layer style={sky}>
        <Defs>
          <LinearGradient id="s2-night" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2E44A8" />
            <Stop offset="1" stopColor={ART.indigo} />
          </LinearGradient>
        </Defs>
        <Circle cx="100" cy="98" r="70" fill="url(#s2-night)" />
      </Layer>

      {STARS.map((star) => (<Star key={`${star.x}-${star.y}`} active={active} star={star} />
))}

      <Layer style={moon}>
        <Defs>
          <LinearGradient id="s2-moonface" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFE7BE" />
            <Stop offset="1" stopColor={ART.sand} />
          </LinearGradient>
        </Defs>
        <Path
          d="M78 46 a22 22 0 1 0 17 36 a17.5 17.5 0 1 1 -17 -36 z"
          fill="url(#s2-moonface)"
        />
      </Layer>

      {/* the marker crawling the small hours */}
      <Layer>
        <AnimatedCircle r="7" fill={ART.white} animatedProps={markerProps} />
        <AnimatedCircle r="4" fill={ART.sand} animatedProps={markerProps} />
      </Layer>

      {/* the answer, arriving anyway */}
      <Animated.View style={[StyleSheet.absoluteFill, card]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, cardBob]}>
          <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
            <Shadow cx={112} cy={168} rx={44} ry={9} opacity={0.16} />
            <Path
              d="M62 120 h84 a16 16 0 0 1 16 16 v18 a16 16 0 0 1 -16 16 h-58 l-15 13 v-13 h-11 a16 16 0 0 1 -16 -16 v-18 a16 16 0 0 1 16 -16 z"
              fill={ART.white}
            />
            <Rect x="62" y="133" width="66" height="7" rx="3.5" fill={ART.sky} />
            <Rect x="62" y="146" width="46" height="7" rx="3.5" fill={ART.mist} />
            <Circle cx="146" cy="147" r="9" fill={ART.blue} />
            <Path
              d="M143 147 h6 M146.5 144 l3 3 -3 3"
              stroke={ART.white}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Frame>
);
}

function Star({
  active,
  star,
}: {
  active: boolean;
  star: (typeof STARS)[number];
}) {
  const twinkle = useOscillation(active, 2200, star.phase);
  const arrive = useFadeIn(active, 500 + star.phase / 6, 1, 500);

  const props = useAnimatedProps(() => ({
    opacity: star.o * interpolate(twinkle.value, [0, 1], [0.45, 1]),
  }));

  return (<Animated.View style={[StyleSheet.absoluteFill, arrive]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
        <AnimatedCircle
          cx={star.x}
          cy={star.y}
          r={star.r}
          fill={ART.white}
          animatedProps={props}
        />
      </Svg>
    </Animated.View>
);
}

// ═══════════════════════════════════════════════════════════════════════════
// 3 · The glass, filling, against the clock
// ═══════════════════════════════════════════════════════════════════════════

/** The tumbler. Shared by the body, the outline and the liquid's clip path. */
const GLASS = 'M70 52 h60 l-5 100 a10 10 0 0 1 -10 9 h-30 a10 10 0 0 1 -10 -9 z';
const PROGRESS_R = 76;
const PROGRESS_C = 2 * Math.PI * PROGRESS_R;
/** How far round the ring the prep has got. */
const PROGRESS = 0.68;

const BUBBLES = [
  { x: 88, r: 5.5, phase: 0 },
  { x: 111, r: 3.6, phase: 0.42 },
  { x: 95, r: 4.4, phase: 0.74 },
];

/**
 * Slide three: prep-night tracking.
 *
 * The glass lands, the liquid rises to the line and keeps moving, bubbles climb
 * through it, and the ring closes around the outside. Volume and time are the
 * two things clinicians said decide the outcome, so they are the two things the
 * drawing is made of: one is the fill, the other is the ring.
 */
export function PurgeGlass({ active }: IllustrationProps) {
  const glass = usePopIn(active, 160, 0.84);
  const ring = useDrawOn(active, PROGRESS_C * PROGRESS, 380, 1500);
  const ringCap = usePopIn(active, 1700, 0.3);
  const fillIn = useFadeIn(active, 700, 1, 500);

  const level = useOnce(active, 720, 1600);
  const ripple = useOscillation(active, 2300, 2200);
  const rise = useTravel(active, 4200, 2400);

  const surfaceProps = useAnimatedProps(() => {
    const y = interpolate(level.value, [0, 1], [156, 80]);
    const lift = interpolate(ripple.value, [0, 1], [-2.2, 2.2]);
    return {
      // A rolling surface rather than a flat cap: the two control points move
      // in opposition, which is what makes it read as liquid.
      d: `M58 ${y} c14 ${-6 + lift} 28 ${6 + lift} 42 0 s28 ${-6 - lift} 42 0 v100 h-84 z`,
    };
  });

  return (<Frame active={active} id="s3">
      <Layer>
        <Circle cx="46" cy="58" r="24" fill={ART.mist} opacity={0.95} />
        <Circle cx="158" cy="142" r="22" fill={ART.cream} opacity={0.95} />
        <Circle cx="100" cy="100" r={PROGRESS_R} fill="none" stroke={ART.mist} strokeWidth={9} />
      </Layer>

      {/* the ring closing */}
      <Layer>
        <AnimatedPath
          d={arcPath(100, 100, PROGRESS_R, 0, 360 * PROGRESS)}
          stroke={ART.blue}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={ring.strokeDasharray}
          animatedProps={ring.animatedProps}
        />
      </Layer>
      <Layer style={ringCap}>
        <Circle cx="100" cy="24" r="8" fill={ART.white} />
        <Circle cx="100" cy="24" r="4.5" fill={ART.blue} />
      </Layer>

      {/* the glass, and what is in it */}
      <Layer style={glass}>
        <Defs>
          <LinearGradient id="s3-body" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ART.white} />
            <Stop offset="1" stopColor="#EDF1FF" />
          </LinearGradient>
        </Defs>
        <Shadow cx={100} cy={165} rx={30} ry={7} opacity={0.14} />
        <Path d={GLASS} fill="url(#s3-body)" />
      </Layer>

      <Animated.View style={[StyleSheet.absoluteFill, fillIn]} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
          <Defs>
            <LinearGradient id="s3-liquid" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={ART.peri} />
              <Stop offset="1" stopColor={ART.blue} />
            </LinearGradient>
            {/*
              The liquid has to be clipped by the real outline, not by a
              narrower rectangle: the tumbler is tapered, so the width the
              liquid may occupy depends on how high it has risen. Reusing GLASS
              for both is what guarantees they cannot disagree.
            */}
            <ClipPath id="s3-clip">
              <Path d={GLASS} />
            </ClipPath>
          </Defs>
          <G clipPath="url(#s3-clip)">
            <AnimatedPath animatedProps={surfaceProps} fill="url(#s3-liquid)" />
            <Rect x="75" y="52" width="9" height="112" rx="4.5" fill={ART.white} opacity={0.4} />
          </G>
        </Svg>
      </Animated.View>

      {BUBBLES.map((bubble) => (<Bubble key={bubble.x} bubble={bubble} rise={rise} level={level} />
))}

      <Layer style={glass}>
        <Path d={GLASS} fill="none" stroke={ART.sky} strokeWidth={2.8} />
        <Rect x="66" y="46" width="68" height="10" rx="5" fill={ART.white} stroke={ART.sky} strokeWidth={2.2} />
      </Layer>
    </Frame>
);
}

/** One bubble, climbing from the base to the surface and fading out. */
function Bubble({
  bubble,
  rise,
  level,
}: {
  bubble: (typeof BUBBLES)[number];
  rise: SharedValue<number>;
  level: SharedValue<number>;
}) {
  const props = useAnimatedProps(() => {
    const t = (rise.value + bubble.phase) % 1;
    const surface = interpolate(level.value, [0, 1], [156, 80]);
    return {
      cy: interpolate(t, [0, 1], [154, surface + 6]),
      // Fades in off the base and out as it reaches the top, so it never
      // visibly pops through the surface.
      opacity: interpolate(t, [0, 0.15, 0.8, 1], [0, 0.34, 0.28, 0]) * level.value,
    };
  });

  return (<Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
        <Defs>
          <ClipPath id={`s3-bubble-${bubble.x}`}>
            <Path d={GLASS} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#s3-bubble-${bubble.x})`}>
          <AnimatedCircle cx={bubble.x} r={bubble.r} fill={ART.white} animatedProps={props} />
        </G>
      </Svg>
    </Animated.View>
);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4 · Four signals, one summary
// ═══════════════════════════════════════════════════════════════════════════

const CHIPS = [
  { y: 58, colour: ART.sky },
  { y: 88, colour: ART.peri },
  { y: 118, colour: ART.sand },
  { y: 148, colour: ART.violet },
];

const BARS = [
  { y: 120, to: 50 },
  { y: 135, to: 66 },
  { y: 150, to: 36 },
];

/**
 * Slide four: the summary the nurse reads.
 *
 * A card assembles: four signals arrive from the left, three bars fill to
 * different lengths, and only then does the flag settle on green. Drawn as a
 * document rather than as a wiring diagram, because that is what it is: a
 * short account the patient carries to admission, not a machine's verdict.
 *
 * It resolves to green, which is worth naming: onboarding is seen before any
 * preparation has happened, and opening a patient's first encounter with the
 * app on a red flag would be a small cruelty.
 */
export function FlagSignal({ active }: IllustrationProps) {
  const card = usePopIn(active, 140, 0.86);
  const header = useFadeIn(active, 620, 1, 420);
  const pill = usePopIn(active, 1650, 0.5);

  const glow = useOscillation(active, 2200, 2100);
  const pillGlow = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.035]) }],
  }));

  return (<Frame active={active} id="s4">
      <Layer>
        <Circle cx="156" cy="50" r="26" fill={ART.cream} opacity={0.9} />
      </Layer>

      <Layer style={card}>
        <Defs>
          <LinearGradient id="s4-card" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ART.white} />
            <Stop offset="1" stopColor="#F5F8FF" />
          </LinearGradient>
        </Defs>
        <Shadow cx={118} cy={176} rx={48} ry={10} opacity={0.14} />
        <G transform="rotate(-4 118 108)">
          <Rect
            x="74"
            y="40"
            width="98"
            height="134"
            rx="21"
            fill="url(#s4-card)"
            stroke={ART.mist}
            strokeWidth={2}
          />
        </G>
      </Layer>

      <Layer style={header}>
        <G transform="rotate(-4 118 108)">
          <Rect x="86" y="56" width="42" height="8" rx="4" fill={ART.mist} />
        </G>
      </Layer>

      {BARS.map((bar, index) => (<Bar key={bar.y} active={active} bar={bar} index={index} />
))}

      {CHIPS.map((chip, index) => (<Chip key={chip.y} active={active} chip={chip} index={index} />
))}

      {/* the flag, landing last */}
      <Animated.View style={[StyleSheet.absoluteFill, pill]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, pillGlow]}>
          <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
            <G transform="rotate(-4 118 108)">
              <Rect
                x="86"
                y="76"
                width="74"
                height="32"
                rx="16"
                fill={ART.flagTint}
                stroke={ART.flagInk}
                strokeWidth={2.6}
              />
              <Path
                d="M105 92 l6 6 13 -14"
                stroke={ART.flagInk}
                strokeWidth={3.6}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </G>
          </Svg>
        </Animated.View>
      </Animated.View>
    </Frame>
);
}

/** One measured signal, filling to its own length. */
function Bar({ active, bar, index }: { active: boolean; bar: (typeof BARS)[number]; index: number }) {
  const fill = useOnce(active, 900 + index * 160, 620);
  const props = useAnimatedProps(() => ({ width: fill.value * bar.to }));
  const track = useFadeIn(active, 780 + index * 160, 1, 380);

  return (<Animated.View style={[StyleSheet.absoluteFill, track]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
        <G transform="rotate(-4 118 108)">
          <Rect x="86" y={bar.y} width="70" height="8" rx="4" fill={ART.mist} />
          <AnimatedRect x="86" y={bar.y} height="8" rx="4" fill={ART.peri} animatedProps={props} />
        </G>
      </Svg>
    </Animated.View>
);
}

/** One signal arriving from the left, with a trail behind it. */
function Chip({ active, chip, index }: { active: boolean; chip: (typeof CHIPS)[number]; index: number }) {
  const arrive = useSlideIn(active, 500 + index * 130, -26, 0);
  const pulse = useTravel(active, 2600, 1400 + index * 200);

  const trail = useAnimatedProps(() => ({
    cx: interpolate(pulse.value, [0, 0.7, 1], [45, 63, 63]),
    opacity: interpolate(pulse.value, [0, 0.1, 0.6, 0.75, 1], [0, 0.9, 0.9, 0, 0]),
  }));

  return (<Animated.View style={[StyleSheet.absoluteFill, arrive]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
        <Shadow cx={28} cy={chip.y + 13} rx={10} ry={3} opacity={0.1} />
        <Circle cx="28" cy={chip.y} r="11" fill={chip.colour} />
        {[0, 1, 2].map((k) => (<Circle
            key={k}
            cx={45 + k * 9}
            cy={chip.y}
            r="2.4"
            fill={chip.colour}
            opacity={0.28 - k * 0.06}
          />
))}
        <AnimatedCircle cy={chip.y} r="2.8" fill={chip.colour} animatedProps={trail} />
      </Svg>
    </Animated.View>
);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5 · The shield, and the two things it will not do
// ═══════════════════════════════════════════════════════════════════════════

const SHIELD = 'M100 32 L158 57 v45 c0 35 -23 60 -58 72 c-35 -12 -58 -37 -58 -72 V57 Z';

/**
 * Slide five: the two guardrails.
 *
 * The shield lands with the clinical team inside it, and then the two things
 * the app refuses to do fly in and are struck through: a bottle of preparation,
 * and a photograph. Nothing resolves and there is no tick, because the slide is
 * not a reassurance: it is a limit, and the drawing should feel like one.
 */
export function Handover({ active }: IllustrationProps) {
  const shield = usePopIn(active, 120, 0.8);
  const inner = useFadeIn(active, 620, 0.5, 520);
  const person = useFadeIn(active, 820, 1, 560);

  const doseToken = useSlideIn(active, 1150, -30, 10);
  const photoToken = useSlideIn(active, 1320, 30, 10);
  const doseSlash = useDrawOn(active, 44, 1600, 340);
  const photoSlash = useDrawOn(active, 44, 1780, 340);

  const float = useOscillation(active, 3400, 2000);
  const floatA = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -4]) }],
  }));
  const floatB = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [-3, 2]) }],
  }));

  return (<Frame active={active} id="s5" tint={ART.blue}>
      <Layer style={shield}>
        <Defs>
          <LinearGradient id="s5-shield" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={ART.peri} />
            <Stop offset="1" stopColor={ART.blue} />
          </LinearGradient>
        </Defs>
        <Shadow cx={100} cy={180} rx={42} ry={9} opacity={0.16} />
        <Path d={SHIELD} fill="url(#s5-shield)" />
      </Layer>

      <Layer style={inner}>
        <Defs>
          <LinearGradient id="s5-inner" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#6E88FF" />
            <Stop offset="1" stopColor={ART.indigo} />
          </LinearGradient>
        </Defs>
        <Path
          d="M100 45 L146 65 v37 c0 28 -18 48 -46 58 c-28 -10 -46 -30 -46 -58 V65 Z"
          fill="url(#s5-inner)"
        />
      </Layer>

      {/* the person who actually decides */}
      <Layer style={person}>
        <Circle cx="100" cy="85" r="17.5" fill={ART.white} />
        <Path d="M73 133 a27 27 0 0 1 54 0 z" fill={ART.white} />
      </Layer>

      {/* never: another dose */}
      <Animated.View style={[StyleSheet.absoluteFill, doseToken]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, floatA]}>
          <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
            <Shadow cx={40} cy={174} rx={20} ry={6} opacity={0.12} />
            <Circle cx="40" cy="150" r="25" fill={ART.white} stroke={ART.mist} strokeWidth={2} />
            <Rect x="35" y="136" width="10" height="6" rx="2" fill={ART.peach} />
            <Path d="M32 143 h16 v16 a5 5 0 0 1 -5 5 h-6 a5 5 0 0 1 -5 -5 z" fill={ART.sand} />
            <Rect x="32" y="152" width="16" height="7" fill={ART.peach} opacity={0.55} />
            <AnimatedPath
              d="M26 164 L54 136"
              stroke={ART.peach}
              strokeWidth={4.6}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={doseSlash.strokeDasharray}
              animatedProps={doseSlash.animatedProps}
            />
          </Svg>
        </Animated.View>
      </Animated.View>

      {/* never: a photograph deciding on its own */}
      <Animated.View style={[StyleSheet.absoluteFill, photoToken]} pointerEvents="none">
        <Animated.View style={[StyleSheet.absoluteFill, floatB]}>
          <Svg width="100%" height="100%" viewBox={VIEW_BOX}>
            <Shadow cx={160} cy={174} rx={20} ry={6} opacity={0.12} />
            <Circle cx="160" cy="150" r="25" fill={ART.white} stroke={ART.mist} strokeWidth={2} />
            <Rect x="154" y="136" width="12" height="5" rx="2.5" fill={ART.sky} />
            <Rect x="148" y="140" width="24" height="19" rx="5" fill={ART.sky} />
            <Circle cx="160" cy="150" r="5.5" fill={ART.white} />
            <AnimatedPath
              d="M146 164 L174 136"
              stroke={ART.peach}
              strokeWidth={4.6}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={photoSlash.strokeDasharray}
              animatedProps={photoSlash.animatedProps}
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </Frame>
);
}

// ---------------------------------------------------------------------------

/**
 * The wash behind the whole pager, held back against the scroll so it moves at
 * a different rate from everything on top of it.
 */
export function Backdrop({ style }: { style?: object }) {
  return (<Animated.View style={[styles.backdrop, style]} pointerEvents="none">
      <Svg width="140%" height="100%" viewBox="0 0 560 900" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="bd-a" cx="30%" cy="24%" r="52%">
            <Stop offset="0" stopColor={ART.peri} stopOpacity="0.16" />
            <Stop offset="1" stopColor={ART.peri} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="bd-b" cx="78%" cy="70%" r="48%">
            <Stop offset="0" stopColor={ART.sand} stopOpacity="0.14" />
            <Stop offset="1" stopColor={ART.sand} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="560" height="900" fill="url(#bd-a)" />
        <Rect width="560" height="900" fill="url(#bd-b)" />
      </Svg>
    </Animated.View>
);
}

const styles = StyleSheet.create({
  // The caller sizes the box; the frame simply fills it.
  frame: { width: '100%', height: '100%' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
