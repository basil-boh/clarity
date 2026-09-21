import * as Haptics from 'expo-haptics';
import { useState, type ComponentType } from 'react';
import {
  Platform,
  Pressable,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Wordmark } from '@/views/components/Wordmark';
import { Button, Overline, Text } from '@/views/components/ui';
import {
  artSizeFor,
  Backdrop,
  DietPlate,
  FlagSignal,
  Handover,
  NightHours,
  PurgeGlass,
  type IllustrationProps,
} from '@/views/components/onboarding/illustrations';
import { useOnboardingController } from '@/controllers/useOnboardingController';
import { colors, radius, spacing } from '@/theme';

type Slide = {
  key: string;
  /** Absent on the brand slide, which leads with the mark instead. */
  eyebrow?: string;
  title: string;
  body?: string;
  /**
   * Set on the title page, whose line is a strapline under a logotype rather
   * than a slide heading: lighter, smaller, and in the one non-Inter face in
   * the app.
   */
  strapline?: boolean;
  art: ComponentType<IllustrationProps>;
};

/**
 * Five slides.
 *
 * The first four are the four parts of the app, in the order the patient meets
 * them: the diet days, the hours when nobody can be reached, the purge night,
 * the morning after. Each names something the reader can *do*, never a quality
 * the app claims to have.
 *
 * Titles are held to one line at phone width, and bodies to roughly a dozen
 * words. The one-line rule is not fussiness: the slide centres its content, so
 * a title that wraps makes the whole block taller and every element above it
 * jumps as you swipe onto that slide. The detail the bodies used to carry (which scale the stool check uses, why the app will not authorise a second
 * dose) all lives on the screen that needs it, and a tour is read standing up.
 *
 * The fifth is the one that does not belong in a normal onboarding: the two
 * things this app will never do. It is last on purpose. A patient who has just
 * been shown a photograph-based meal check and a stool check is exactly the
 * person entitled to know where the software stops, and being told before they
 * ever use it is worth more than a disclaimer they meet at the moment they are
 * frightened.
 */
const SLIDES: Slide[] = [
  {
    key: 'brand',
    title: 'Your preparation, made clear.',
    strapline: true,
    art: TitleMark,
  },
  {
    key: 'diet',
    eyebrow: 'The three diet days',
    title: 'Built around what you eat',
    body: 'Made from your own profile. Unsure about a dish? Photograph it.',
    art: DietPlate,
  },
  {
    key: 'hours',
    eyebrow: 'Six in the evening, to two',
    title: 'The hours nobody covers',
    body: 'Ask anything, at any hour. We say when to speak to a person instead.',
    art: NightHours,
  },
  {
    key: 'purge',
    eyebrow: 'The purge night',
    title: 'The full volume, on time',
    body: 'An alert for every dose, and a way to check if it is working.',
    art: PurgeGlass,
  },
  {
    key: 'flag',
    eyebrow: 'The morning of',
    title: 'What your nurse sees',
    body: 'One short summary at admission, not a guess at the desk.',
    art: FlagSignal,
  },
  {
    key: 'limits',
    eyebrow: 'Before you start',
    title: 'Two things we never do',
    body: 'We never tell you to take more preparation. A photograph never decides your scope.',
    art: Handover,
  },
];

/**
 * The title page: the name, drawn, and what the app is for.
 *
 * One lockup rather than a mark stacked above a word. The mark is a C, so it
 * serves as the word's first letter.
 *
 * It is swept on stroke by stroke rather than faded in, which is the one place
 * in the app where a flourish is the right answer: it is the first second a
 * frightened patient spends here, and it should feel like something made with
 * care rather than a form to get through.
 */
function TitleMark({ active }: IllustrationProps) {
  return (
    <View style={styles.brandMark}>
      <Wordmark size={278} delay={180} active={active} />
    </View>
  );
}

/**
 * The welcome tour.
 *
 * Three layers move at three speeds as you swipe: a colour wash behind, the
 * illustration lagging slightly, the words running slightly ahead. That
 * difference is the whole trick: it is what makes a horizontal pager read as
 * depth rather than as a filmstrip.
 *
 * Whether this screen is reached at all is decided in `app/_layout.tsx`, from
 * the flag in `features/onboarding/state`.
 */
export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { complete } = useOnboardingController();
  const artSize = artSizeFor(width);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const isLast = index === SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  function goTo(next: number) {
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: !reduced });
  }

  function handleSettle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const landed = Math.round(event.nativeEvent.contentOffset.x / width);
    if (landed === index) return;
    setIndex(landed);
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
  }

  function handleAdvance() {
    if (isLast) {
      complete();
      return;
    }
    goTo(index + 1);
  }

  const wash = useAnimatedStyle(() => ({
    transform: [{ translateX: -scrollX.value * 0.06 }],
  }));

  // Tracks the scroll rather than the settled index, so it arrives with the
  // swipe instead of snapping in once the page lands.
  const brandBar = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [0, width * 0.65], [0, 1], Extrapolation.CLAMP),
  }));

  return (<View style={styles.page}>
      <Backdrop style={wash} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        {/* The same logotype the title page draws, held static and small.
            Previously this was the mark beside "Colonaid" set in Inter, which
            put a second, blacker version of the name on the one screen where
            the drawn one is the whole point.

            Held back until the reader leaves the title page, where the logotype
            is already the entire illustration. Two of them on one screen is a
            brand reassuring itself. */}
        <Animated.View style={[styles.brand, brandBar]}>
          <Wordmark size={96} animate={false} />
        </Animated.View>

        {/* Skip stops one slide short of the end. The guardrails on slide five
            are the one thing here that is not a feature pitch, so skipping the
            tour takes you to them rather than past them. */}
        <Pressable
          onPress={() => (isLast ? complete() : goTo(SLIDES.length - 1))}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Finish the introduction' : 'Skip to the last slide'}
          style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
        >
          <Text variant="caption" tone="muted">
            {isLast ? 'Done' : 'Skip'}
          </Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleSettle}
        style={styles.pager}
      >
        {SLIDES.map((slide, slideIndex) => (<SlidePage
            key={slide.key}
            slide={slide}
            index={slideIndex}
            width={width}
            scrollX={scrollX}
            active={index === slideIndex}
            artSize={artSize}
          />
))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View
          style={styles.dots}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${index + 1} of ${SLIDES.length}`}
        >
          {SLIDES.map((slide, dotIndex) => (<Dot key={slide.key} index={dotIndex} width={width} scrollX={scrollX} />
))}
        </View>

        <Button
          label={isLast ? 'I understand, get started' : 'Continue'}
          onPress={handleAdvance}
          size="lg"
          fullWidth
        />
      </View>
    </View>
);
}

// ---------------------------------------------------------------------------

function SlidePage({
  slide,
  index,
  width,
  scrollX,
  active,
  artSize,
}: {
  slide: Slide;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  active: boolean;
  artSize: number;
}) {
  const Art = slide.art;

  // Held back against the scroll, so the illustration sits behind the page.
  const artStyle = useAnimatedStyle(() => {
    const progress = (scrollX.value - index * width) / width;
    const distance = Math.abs(progress);

    return {
      opacity: interpolate(distance, [0, 0.85], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: progress * width * 0.4 },
        { scale: interpolate(distance, [0, 1], [1, 0.86], Extrapolation.CLAMP) },
        { rotate: `${interpolate(progress, [-1, 1], [8, -8], Extrapolation.CLAMP)}deg` },
      ],
    };
  });

  // Pushed ahead of it, so the words lead the movement out and in.
  const copyStyle = useAnimatedStyle(() => {
    const progress = (scrollX.value - index * width) / width;
    const distance = Math.abs(progress);

    return {
      opacity: interpolate(distance, [0, 0.55], [1, 0], Extrapolation.CLAMP),
      transform: [{ translateX: -progress * width * 0.3 }],
    };
  });

  return (<View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.art, { width: artSize, height: artSize }, artStyle]}>
        <Art active={active} />
      </Animated.View>

      <Animated.View style={[styles.copy, copyStyle]}>
        {slide.eyebrow ? <Overline tone="primary">{slide.eyebrow}</Overline> : null}
        <Text
          variant={slide.strapline ? 'slogan' : 'display'}
          tone={slide.strapline ? 'muted' : 'default'}
          center
          // One line or nothing: a strapline that wraps stops being one.
          numberOfLines={slide.strapline ? 1 : undefined}
          adjustsFontSizeToFit={slide.strapline}
          style={styles.title}
        >
          {slide.title}
        </Text>
        {slide.body ? (
          <Text variant="body" tone="muted" center>
            {slide.body}
          </Text>
        ) : null}
      </Animated.View>
    </View>
);
}

/** The current step widens into a bar; the rest stay ticks. */
function Dot({
  index,
  width,
  scrollX,
}: {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs((scrollX.value - index * width) / width);
    return {
      width: interpolate(distance, [0, 1], [26, 7], Extrapolation.CLAMP),
      opacity: interpolate(distance, [0, 1], [1, 0.28], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.card },
  topBar: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { justifyContent: 'center' },
  brandMark: { alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  skip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  skipPressed: { opacity: 0.5 },
  pager: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing['3xl'],
  },
  art: { alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', gap: spacing.sm, maxWidth: 380 },
  title: { marginBottom: spacing.xs },
  footer: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: { height: 7, borderRadius: radius.full, backgroundColor: colors.primary },
});
