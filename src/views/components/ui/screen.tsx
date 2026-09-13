import { createContext, useContext, useState, type ReactNode } from 'react';
import { RefreshControl, StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, spacing } from '@/theme';

/**
 * The page's live scroll offset, for anything inside it that should wait until
 * it is actually on screen. `null` outside a scrolling `Screen`, where there is
 * nothing to wait for.
 */
const ScrollOffset = createContext<SharedValue<number> | null>(null);

/**
 * How far up the window a block's top edge has to come before it counts as
 * seen, as a fraction of the window's height.
 *
 * Not the bottom edge of the window: the tab bar floats over the last ~80pt of
 * it, and an animation that plays underneath the glass has been missed just as
 * surely as one that played off-screen.
 */
const SEEN_LINE = 0.85;

/**
 * Flips `seen` to true the first time the block carrying `ref` scrolls into
 * view, and never back.
 *
 * Latched rather than live because the one thing using it is a value animating
 * *to* its position: replaying that every time the block leaves and re-enters
 * the screen would turn feedback into a screensaver.
 *
 * Checked on the UI thread against the scroll offset, so nothing crosses to JS
 * on every frame of a scroll; the single hop is the moment it latches. Layout
 * is watched as well as scroll, which covers the block that is already on
 * screen when it mounts and would otherwise wait for a scroll that never comes.
 */
export function useScrolledIntoView() {
  const ref = useAnimatedRef<Animated.View>();
  const offset = useContext(ScrollOffset);
  const { height } = useWindowDimensions();
  const [seen, setSeen] = useState(offset === null);
  const latched = useSharedValue(offset === null);
  const layouts = useSharedValue(0);

  useAnimatedReaction(
    () => [offset?.value ?? 0, layouts.value],
    () => {
      if (latched.value) return;
      // Nothing is measured until the block has reported a layout, which is
      // what proves `ref` is attached to a mounted view. This is load-bearing:
      // on the UI thread an unattached animated ref reads as `null`, and
      // `measure` only guards against `-1`, so it hands the null straight to
      // native, which throws, and a throw inside a frame callback takes the
      // whole app down rather than showing a red screen. It crashed Today on
      // launch, where a "Not recorded" meter renders without the ref.
      if (layouts.value === 0) return;
      const box = measure(ref);
      // Unmeasured views report nothing, or a zero box at the origin, which
      // would pass the test below and latch before the block was ever shown.
      if (box === null || (box.width === 0 && box.height === 0)) return;
      if (box.pageY < height * SEEN_LINE) {
        latched.value = true;
        scheduleOnRN(setSeen, true);
      }
    },
    [height],
  );

  const onLayout = () => {
    layouts.value += 1;
  };

  return { ref, onLayout, seen };
}

/**
 * The standard page frame.
 *
 * Deliberately *not* an animation boundary. The obvious idea (stagger the
 * children here so every screen is polished for free) quietly breaks the
 * layout: `content` spaces its children with a column `gap`, and on most
 * screens a single child expands into the page's blocks. Wrapping that child
 * puts all of them inside one view, leaving the gap with one thing to space.
 *
 * The rule that falls out: apply a stagger where its `Reveal`s land as direct
 * children of the gapped container, never around something that expands into
 * many blocks later.
 */

/**
 * The frame's own padding, exported because a full-bleed child has to cancel it
 * exactly: the carousel bleeds horizontally, a header photograph both ways.
 */
export const SCREEN_PADDING_X = spacing.lg;
export const SCREEN_PADDING_TOP = spacing.sm;

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  contentStyle,
  style,
  edges = 'top',
}: {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  /** Override the page ground. The prep-night screen goes dark with it. */
  style?: ViewStyle;
  edges?: 'top' | 'none';
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = edges === 'top' ? insets.top + SCREEN_PADDING_TOP : SCREEN_PADDING_TOP;
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const offset = useScrollOffset(scrollRef);

  if (!scroll) {
    return (<View style={[styles.page, style, { paddingTop }]}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
);
  }

  return (<ScrollOffset.Provider value={offset}>
    <Animated.ScrollView
      ref={scrollRef}
      scrollEventThrottle={16}
      style={[styles.page, style]}
      contentContainerStyle={[
        styles.content,
        { paddingTop, paddingBottom: insets.bottom + spacing['5xl'] },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (<RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
) : undefined
      }
    >
      {children}
    </Animated.ScrollView>
  </ScrollOffset.Provider>
);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: SCREEN_PADDING_X, gap: spacing.xl },
});
