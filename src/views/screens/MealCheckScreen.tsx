import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Confidence, Overline, Screen, ScreenHeader, Text } from '@/views/components/ui';
import { useMealCheckController } from '@/controllers/useCheckControllers';
import type { MealCheck, MealVerdict } from '@/models/prep/prep.types';
import { colors, flag as flagColours, radius, spacing } from '@/theme';

/**
 * The meal check (feature 04).
 *
 * ── SCAFFOLD ───────────────────────────────────────────────────────────────
 * The camera is not wired up. `expo-camera` is already a dependency and the
 * permission strings are in `app.json`; the real screen puts a `CameraView`
 * where `Viewfinder` is, posts the frame, and renders the response with the
 * same three components below.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Three properties the real one has to keep:
 *
 * - **The photograph does not leave, and does not stay.** It is sent, read and
 *   dropped. "It stays between you and the app" was how CW12 put it to
 *   patients, and a stored gallery of what someone ate would make that false.
 * - **`unsure` is a first-class verdict**, not an error state. A model that
 *   must answer yes or no will answer wrongly, and a wrong "yes" here costs a
 *   procedure slot.
 * - **Confidence is always shown.** Same rule as the stool check.
 */

const PRESENTATION: Record<
  MealVerdict,
  { title: string; icon: keyof typeof Ionicons.glyphMap; ink: string; tint: string }
> = {
  ok: {
    title: 'This looks fine',
    icon: 'checkmark-circle',
    ink: colors.primary,
    tint: colors.primarySoft,
  },
  avoid: {
    title: 'Better to leave this',
    icon: 'close-circle',
    ink: flagColours.amber.ink,
    tint: flagColours.amber.tint,
  },
  unsure: {
    title: 'I cannot tell',
    icon: 'help-circle',
    ink: colors.textMuted,
    tint: colors.cardSunken,
  },
};

export default function MealCheckScreen() {
  const router = useRouter();
  const { result, capture, reset, isScoring } = useMealCheckController();

  return (
    <Screen edges="none">
      <ScreenHeader subtitle="Photograph the plate. It is not saved." />

      {result === null ? (
        <>
          <Viewfinder hint="Put the whole plate in frame, from above." />
          <Button
            label="Take the photo"
            icon="camera"
            size="lg"
            fullWidth
            loading={isScoring}
            onPress={capture}
          />
          <Text variant="caption" tone="faint" center>
            Scaffold: the shutter returns a fixed example.
          </Text>
        </>
      ) : (
        <>
          <Verdict result={result} />
          <Button label="Check another" variant="secondary" fullWidth onPress={reset} />
          <Button label="Ask about this instead" variant="ghost" fullWidth onPress={() => router.push('/(tabs)/ask')} />
        </>
      )}
    </Screen>
  );
}

function Viewfinder({ hint }: { hint: string }) {
  return (
    <View style={styles.viewfinder}>
      <Ionicons name="camera-outline" size={40} color={colors.textFaint} />
      <Text variant="callout" tone="muted" center>
        {hint}
      </Text>
    </View>
  );
}

function Verdict({ result }: { result: MealCheck }) {
  const presentation = PRESENTATION[result.verdict];

  return (
    <View style={styles.stack}>
      <Card style={{ backgroundColor: presentation.tint, borderColor: presentation.ink }}>
        <View style={styles.verdictHead}>
          <Ionicons name={presentation.icon} size={26} color={presentation.ink} />
          <Text variant="heading" style={{ color: presentation.ink }}>
            {presentation.title}
          </Text>
        </View>
        <Text variant="body" style={styles.reason}>
          {result.reason}
        </Text>
      </Card>

      <Card>
        <Overline>What I saw</Overline>
        <Text variant="body" style={styles.items}>
          {result.items.join(' · ')}
        </Text>
        <Confidence value={result.confidence} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  viewfinder: {
    aspectRatio: 3 / 4,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.cardSunken,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing['3xl'],
  },
  verdictHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reason: { marginTop: spacing.sm },
  items: { marginTop: spacing.xs, marginBottom: spacing.md },
});
