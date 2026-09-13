import { useFocusEffect } from 'expo-router';
import { Children, Fragment, isValidElement, useCallback, type ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme';

/**
 * Motion primitives.
 *
 * Two rules keep the movement feeling designed rather than decorative:
 *
 * 1. Everything borrows its duration from the `motion` tokens, so the whole app
 *    moves with one rhythm.
 * 2. Every animation checks `useReducedMotion()`. Motion is an enhancement; a
 *    user who has switched it off still gets the whole interface, just without
 *    the travel.
 */

/** Distance a revealed block travels on entry. Small: a hint, not a slide. */
const RISE = 14;

/** Settles quickly with a trace of overshoot, not a bounce. */
const SPRING = { damping: 18, stiffness: 260, mass: 0.5 } as const;

/** Gap between successive items in a staggered group. */
export const STAGGER_MS = 55;

/**
 * Fades a block in, rising slightly into place, each time its screen is
 * focused.
 *
 * Driven by focus rather than by mount, which is what makes it work under a
 * native tab bar: `entering` animations run once, when the view joins the tree,
 * but a `UITabBarController` keeps every tab it has shown alive, so a screen
 * you return to was never unmounted and would sit perfectly still. Animating a
 * shared value on focus re-runs on every visit without a remount, so scroll
 * position and in-flight queries survive.
 */
export function Reveal({
  children,
  index = 0,
  delay = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  const total = Math.min(delay + index * STAGGER_MS, 600);
  const progress = useSharedValue(reduced ? 1 : 0);

  useFocusEffect(useCallback(() => {
      if (reduced) {
        progress.value = 1;
        return;
      }
      progress.value = 0;
      progress.value = withDelay(total,
        withTiming(1, { duration: motion.slow, easing: Easing.out(Easing.cubic) }),
);
    }, [reduced, total, progress]),
);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * RISE }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/** A plain cross-fade, for content that swaps in place rather than arriving. */
export function FadeSwap({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  return (<Animated.View style={style} entering={reduced ? undefined : FadeIn.duration(motion.base)}>
      {children}
    </Animated.View>
);
}

/**
 * Cross-fades whenever `swapKey` changes, for a pane replaced in place: the
 * body under a segmented control, say. `FadeSwap` animates once on mount; this
 * re-runs on every change by putting the key on the animated view itself.
 */
export function Swap({
  swapKey,
  children,
  style,
}: {
  swapKey: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();
  return (<Animated.View
      key={swapKey}
      style={style}
      entering={reduced ? undefined : FadeIn.duration(motion.base)}
    >
      {children}
    </Animated.View>
);
}

/**
 * Flattens fragments out of a child list.
 *
 * `Children.toArray` flattens nested *arrays* but stops at a `<>…</>`, handing
 * it back as one element. That matters: a screen returning its blocks inside a
 * fragment would be wrapped as a single unit, putting every block inside one
 * animated view, which silently swallows the column `gap` the parent was
 * spacing them with.
 */
function flattenChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement(child) && child.type === Fragment
      ? flattenChildren((child.props as { children?: ReactNode }).children)
      : [child],
);
}

/**
 * Reveals each child in turn, one `STAGGER_MS` behind the last: the shape
 * almost every screen wants, and the thing that stops two screens disagreeing
 * about the rhythm.
 *
 * One caveat: a conditionally rendered child shifts the position of everything
 * after it, and position is what the generated keys are built from. Give
 * conditional children an explicit `key` so their siblings are not remounted,
 * and re-animated, the moment one appears.
 */
export function Stagger({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (<>
      {flattenChildren(children).map((child, index) => (<Reveal key={isValidElement(child) ? child.key : index} index={index} delay={delay}>
          {child}
        </Reveal>
))}
    </>
);
}

/**
 * Press feedback for a surface that has to own its own `Pressable`.
 *
 * Drive it by setting `press.value` to 1 on press-in and 0 on press-out, then
 * spread `pressStyle` onto the animated surface.
 */
export function usePressFeedback(scaleTo = 0.98) {
  const reduced = useReducedMotion();
  const press = useSharedValue(0);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : withSpring(1 - (1 - scaleTo) * press.value, SPRING) }],
    opacity: withTiming(1 - 0.1 * press.value, { duration: motion.fast }),
  }));

  return { press, pressStyle };
}

/**
 * A pressable that dips slightly under the finger. Spring on the way down: the
 * overshoot on release is what makes a control feel physical rather than merely
 * responsive. The scale is shallow on purpose: past ~2% at card size it reads
 * as the layout breaking.
 */
export function PressableScale({
  children,
  onPress,
  style,
  scaleTo = 0.98,
  disabled,
  accessibilityLabel,
  accessibilityRole = 'button',
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  scaleTo?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link';
}) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : withSpring(1 - (1 - scaleTo) * pressed.value, SPRING) }],
    opacity: withTiming(1 - 0.14 * pressed.value, { duration: motion.fast }),
  }));

  return (<Pressable
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
);
}
