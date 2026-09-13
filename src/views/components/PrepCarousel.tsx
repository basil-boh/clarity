import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { Overline, PressableScale, SCREEN_PADDING_X, Text } from '@/views/components/ui';
import { colors, radius, shadow, spacing } from '@/theme';

/**
 * The prep picture carousel.
 *
 * ── How it moves ───────────────────────────────────────────────────────────
 *
 * It advances a whole card at a time, on a timer, and lands on a snap point.
 * That is deliberately *not* how the Catholic+ event strip moves: that one
 * drifts continuously and never snaps, because nothing on it has to be read.
 * These cards each teach one thing about the preparation to a reader who may
 * be 70, so the movement has to leave the card still long enough to finish a
 * sentence. `DWELL_MS` is the whole argument, and it is set from reading speed
 * rather than from what looks lively.
 *
 * The loop is seamless rather than a rewind. The first few cards are repeated
 * after the last, so advancing past the end lands on a copy of card one; the
 * moment it settles there, the scroll offset is moved back by one full set with
 * animation off. The pixels either side of that move are identical, so there is
 * nothing to see, no rewind, no jump.
 *
 * Three things stop it, in the order they matter:
 *
 * 1. `useReducedMotion`, so a reader who has asked the system for less movement
 *    gets a plain swipeable strip and no automatic motion at all.
 * 2. Losing focus, so it is not animating on a tab nobody is looking at.
 * 3. A touch, which hands control back for `RESUME_MS`. You should never have
 *    to fight a carousel for the card you were reading.
 *
 * Worth knowing: (3) is the only pause control, and it is not a discoverable
 * one. If this ever needs to satisfy WCAG 2.2.2 strictly rather than in spirit,
 * the fix is a visible pause affordance next to the dots, not a longer dwell.
 *
 * ── The parallax ───────────────────────────────────────────────────────────
 *
 * The photograph inside each card is rendered wider than the card and slides
 * against the scroll, so the image drifts within its window as the card crosses
 * the screen. It costs one interpolation and it is the whole difference between
 * a row of pictures and something with depth. The overshoot has to be exactly
 * the travel the interpolation asks for or the card edge shows through at the
 * extremes, so both come from `OVERSHOOT`.
 *
 * Neighbouring cards also sit slightly back (scaled down and dimmed) so the
 * centred card is unambiguous without a border doing the work.
 */

export type PrepSlide = {
  readonly key: string;
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly image: number;
  /** Announced instead of the photograph, which is decorative on its own. */
  readonly alt: string;
};

/**
 * The six cards.
 *
 * They run in journey order (medicines, the diet days, the purge night, the
 * morning) rather than in order of importance, because the strip is also how a
 * patient in the two-year wait finds out what is coming.
 *
 * Photographs are from HealthHub, Singapore's national health portal. See
 * `assets/carousel/SOURCES.md` for the provenance of each one.
 */
export const PREP_SLIDES: readonly PrepSlide[] = [
  {
    key: 'medicines',
    eyebrow: 'A week before',
    title: 'Some medicines stop first',
    body: 'Iron tablets and certain blood thinners are usually held before a scope. Your department confirms which, and when.',
    image: require('../../../assets/carousel/medicines.jpg'),
    alt: 'A pharmacist going through a medicine box with an older man',
  },
  {
    key: 'meal-check',
    eyebrow: 'The three diet days',
    title: '“Can I eat this?”',
    body: 'The most common question patients ask, and the one a printed sheet cannot answer. Photograph the plate and find out.',
    image: require('../../../assets/carousel/meal-check.jpg'),
    alt: 'A plate of nasi lemak with peanuts, egg and sambal',
  },
  {
    key: 'clear-fluids',
    eyebrow: 'The three diet days',
    title: 'Clear fluids, and plenty',
    body: 'Water, clear soup, plain tea. Dehydration cancels more lists than a dirty colon does.',
    image: require('../../../assets/carousel/clear-fluids.jpg'),
    alt: 'Hands holding a glass of water at a table',
  },
  {
    key: 'purgative-time',
    eyebrow: 'The purge night',
    title: 'The full volume, on time',
    body: 'Finishing all of it, at the right hour, is the one thing every clinician agreed decides the outcome.',
    image: require('../../../assets/carousel/purgative-time.jpg'),
    alt: 'A man at a desk with a glass of water and a bottle of medicine',
  },
  {
    key: 'care-team',
    eyebrow: 'Six in the evening to two',
    title: 'Someone to ask at 1am',
    body: 'The hardest hours are the ones when no department can be called. The app answers, and says when you should speak to a person.',
    image: require('../../../assets/carousel/care-team.jpg'),
    alt: 'A nurse at the bedside talking with an older woman',
  },
  {
    key: 'consult',
    eyebrow: 'The morning of',
    title: 'One summary for your nurse',
    body: 'Not a grade. A short account of how the preparation actually went, so nobody has to rely on a yes at the desk.',
    image: require('../../../assets/carousel/consult.jpg'),
    alt: 'A doctor examining an older woman with a relative beside her',
  },
];

// ---------------------------------------------------------------------------

/** How much of the next card shows, so the strip reads as continuing. */
const PEEK = 34;
const GAP = spacing.md;

/** How much wider the photograph is than its window. Drives the parallax. */
const OVERSHOOT = 56;

const RATIO = 3 / 2;

/**
 * How long a card holds before the strip advances.
 *
 * Set from the longest body on a card (about 26 words) at the slow end of
 * adult reading speed, plus the eyebrow and title above it and a moment to
 * look at the photograph. Six seconds is not a lively carousel and is not
 * trying to be.
 */
const DWELL_MS = 6000;

/** Quiet period after the reader touches the strip, before it resumes. */
const RESUME_MS = 9000;

export function PrepCarousel({
  slides = PREP_SLIDES,
  onPressSlide,
}: {
  slides?: readonly PrepSlide[];
  onPressSlide?: (slide: PrepSlide) => void;
}) {
  const { width } = useWindowDimensions();
  const reduced = useReducedMotion();
  const isFocused = useIsFocused();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  /** Set while the reader is driving, so autoplay does not fire the haptic. */
  const userDriven = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The card is measured from the screen, not fixed, so the peek stays a peek
  // on a 320pt SE and on a 430pt Pro Max rather than becoming a sliver or a
  // second column.
  const cardWidth = width - SCREEN_PADDING_X * 2 - PEEK;
  const stride = cardWidth + GAP;

  const count = slides.length;
  // One card has nowhere to rotate to, and duplicating it would put an
  // identical card in the accessibility tree for nothing.
  const loops = count > 1 && !reduced;

  /**
   * Leading cards repeated after the last one, so the wrap has somewhere to
   * land. At least a viewport's worth is required: the final real card can
   * never scroll to the left gutter unless there is content behind it to
   * scroll against, and without that the wrap position is simply unreachable
   * and the strip stalls one card short of the loop.
   */
  const wrapPad = Math.min(count,
    Math.max(1, Math.ceil((width + GAP - SCREEN_PADDING_X * 2) / stride)),
);
  const cards = loops ? [...slides, ...slides.slice(0, wrapPad)] : [...slides];

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  function goTo(next: number, animated = true) {
    scrollRef.current?.scrollTo({ x: next * stride, animated });
    if (!animated) scrollX.value = next * stride;
  }

  /** Advance one card. Wrapping is handled when the scroll settles. */
  useEffect(() => {
    if (!loops || held || !isFocused) return;
    const id = setTimeout(() => {
      const next = index + 1;
      setIndex(next);
      goTo(next);
    }, DWELL_MS);
    return () => clearTimeout(id);
    // `index` is a dependency on purpose: a manual swipe restarts the dwell
    // rather than advancing the moment the reader lets go.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loops, held, isFocused, index, stride]);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  function handleSettle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const landed = Math.round(event.nativeEvent.contentOffset.x / stride);

    if (userDriven.current) {
      userDriven.current = false;
      if (landed !== index && Platform.OS !== 'web') void Haptics.selectionAsync();
    }

    // The invisible half of the loop. Landing on a repeated card means the
    // reader is looking at pixels identical to the card `count` places back, so
    // the offset can be moved there with animation off and nothing changes on
    // screen.
    if (landed >= count) {
      const wrapped = landed - count;
      setIndex(wrapped);
      goTo(wrapped, false);
      return;
    }

    setIndex(landed);
  }

  function hold() {
    userDriven.current = true;
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setHeld(true);
  }

  function release() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setHeld(false), RESUME_MS);
  }

  return (<View style={styles.block}>
      <View style={styles.header}>
        <Overline>Know your prep</Overline>
        <Text variant="caption" tone="faint">
          {(index % count) + 1} of {count}
        </Text>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        // `snapToInterval` with fast deceleration rather than `pagingEnabled`:
        // the cards are narrower than the screen, so a page is not a screen.
        snapToInterval={stride}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleSettle}
        onTouchStart={hold}
        onScrollBeginDrag={hold}
        onScrollEndDrag={release}
        // Bleeds past the page gutter so a card can sit flush at the edge.
        style={[styles.bleed, { marginHorizontal: -SCREEN_PADDING_X }]}
        contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING_X, gap: GAP }}
      >
        {cards.map((slide, position) => {
          // The repeats exist only to make the wrap invisible. They are the
          // same card, so they are hidden from screen readers rather than
          // announced a second time.
          const isRepeat = position >= count;

          return (<SlideCard
              key={`${slide.key}-${position}`}
              slide={slide}
              position={position}
              stride={stride}
              cardWidth={cardWidth}
              scrollX={scrollX}
              hidden={isRepeat}
              onPress={onPressSlide ? () => onPressSlide(slide) : undefined}
            />
);
        })}
      </Animated.ScrollView>

      <View
        style={styles.dots}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`Card ${(index % count) + 1} of ${count}`}
      >
        {slides.map((slide, position) => (<Dot
            key={slide.key}
            position={position}
            count={count}
            stride={stride}
            scrollX={scrollX}
          />
))}
      </View>
    </View>
);
}

// ---------------------------------------------------------------------------

function SlideCard({
  slide,
  position,
  stride,
  cardWidth,
  scrollX,
  hidden,
  onPress,
}: {
  slide: PrepSlide;
  position: number;
  stride: number;
  cardWidth: number;
  scrollX: SharedValue<number>;
  hidden: boolean;
  onPress?: () => void;
}) {
  const height = cardWidth / RATIO;

  // -1 when the card is one place left of centre, 0 when centred, 1 to the
  // right. Every animation on the card is a function of this one number.
  const cardStyle = useAnimatedStyle(() => {
    const progress = (scrollX.value - position * stride) / stride;
    const distance = Math.abs(progress);

    return {
      transform: [{ scale: interpolate(distance, [0, 1], [1, 0.94], Extrapolation.CLAMP) }],
      opacity: interpolate(distance, [0, 1], [1, 0.72], Extrapolation.CLAMP),
    };
  });

  // The photograph slides *against* the scroll inside its window.
  const imageStyle = useAnimatedStyle(() => {
    const progress = (scrollX.value - position * stride) / stride;
    return {
      transform: [
        {
          translateX: interpolate(progress,
            [-1, 1],
            [OVERSHOOT / 2, -OVERSHOOT / 2],
            Extrapolation.CLAMP,
),
        },
      ],
    };
  });

  return (<View
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
    >
      <PressableScale
        onPress={onPress}
        scaleTo={0.985}
        accessibilityLabel={`${slide.title}. ${slide.body}`}
        style={{ width: cardWidth }}
      >
        <Animated.View style={[styles.card, { width: cardWidth, height }, cardStyle]}>
          <Animated.View style={[styles.imageWrap, { width: cardWidth + OVERSHOOT }, imageStyle]}>
            <Image
              source={slide.image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={220}
              accessibilityIgnoresInvertColors
              alt={slide.alt}
            />
          </Animated.View>

          {/* A scrim, not a flat overlay: the photographs vary a lot at the
              bottom edge and white text has to hold on all six. */}
          <LinearGradient
            colors={['transparent', 'rgba(9,11,17,0.18)', 'rgba(9,11,17,0.88)']}
            locations={[0, 0.42, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.caption}>
            <Overline style={styles.eyebrow}>{slide.eyebrow}</Overline>
            <Text variant="heading" tone="inherit" style={styles.title}>
              {slide.title}
            </Text>
            <Text variant="callout" tone="inherit" style={styles.body} numberOfLines={3}>
              {slide.body}
            </Text>
          </View>

          {onPress ? (<View style={styles.chevron} pointerEvents="none">
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
) : null}
        </Animated.View>
      </PressableScale>
    </View>
);
}

/**
 * The centred card's dot widens into a bar; the rest stay ticks.
 *
 * The distance is measured modulo the set, so while the strip is sitting on a
 * repeated card at the wrap the dot for the *original* lights instead. Without
 * that the row would go blank for the one beat the loop passes through.
 */
function Dot({
  position,
  count,
  stride,
  scrollX,
}: {
  position: number;
  count: number;
  stride: number;
  scrollX: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const at = scrollX.value / stride;
    const distance = Math.min(Math.abs(at - position), Math.abs(at - (position + count)));

    return {
      width: interpolate(distance, [0, 1], [22, 6], Extrapolation.CLAMP),
      opacity: interpolate(distance, [0, 1], [1, 0.26], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm + 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  bleed: { overflow: 'visible' },
  card: {
    borderRadius: radius.xl,
    // Clips the oversized photograph to the card. Without it the parallax
    // simply spills over the neighbours.
    overflow: 'hidden',
    backgroundColor: colors.cardSunken,
    ...shadow.card,
  },
  // Pinned to the card's full height and anchored left, but *wider* than the
  // card: the extra width is what the parallax slides within, so `right` is
  // deliberately unset rather than 0.
  imageWrap: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  caption: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg - 2,
    gap: 3,
  },
  eyebrow: { color: 'rgba(255,255,255,0.82)' },
  title: { color: '#FFFFFF' },
  body: { color: 'rgba(255,255,255,0.88)' },
  chevron: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(13,15,20,0.42)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm - 2,
    height: 8,
  },
  dot: { height: 6, borderRadius: radius.full, backgroundColor: colors.primary },
});
