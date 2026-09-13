import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Confidence, Overline, Screen, ScreenHeader, Text } from '@/views/components/ui';
import { NEVER } from '@/models/flag/flag.rules';
import { useStoolCheckController } from '@/controllers/useCheckControllers';
import type { BowelScalePoint, StoolReading } from '@/models/prep/prep.types';
import { colors, flag as flagColours, radius, spacing } from '@/theme';

/**
 * The stool check (feature 07).
 *
 * At one in the morning the patient has exactly one question (*is this
 * working?*) and today they have no way to answer it. This is the feature that
 * answers it, and it is also the one the gastroenterologist put the firmest
 * condition on: the patient must know it is a suggestion, and must know how to
 * reach a person.
 *
 * ── SCAFFOLD ───────────────────────────────────────────────────────────────
 * No camera. The shutter returns a fixed reading. The scale below is a
 * placeholder for the department's own chart, which is what makes the result
 * checkable: a patient told "you want 4 or above" can hold the app's answer
 * against the same words the hospital used.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * The rule that governs everything on this screen: **a photograph never decides
 * whether the scope goes ahead.** It informs the patient and it moves the
 * `bowelOutput` signal behind the flag. The clinical team decides. When a
 * reading is poor, the only action offered is to talk to someone, never to
 * take more preparation.
 */

const SCALE: Record<BowelScalePoint, { label: string; meaning: string; clear: boolean }> = {
  1: { label: 'Solid', meaning: 'Formed stool. The preparation has not started working yet.', clear: false },
  2: { label: 'Mostly solid', meaning: 'Still formed, some liquid. Keep going with the fluids.', clear: false },
  3: { label: 'Cloudy liquid', meaning: 'Liquid with solid pieces. It is starting to work.', clear: false },
  4: { label: 'Light and cloudy', meaning: 'Mostly clear liquid with some cloudiness. This is close.', clear: true },
  5: { label: 'Clear', meaning: 'Clear or pale yellow liquid. This is what the team is looking for.', clear: true },
};

export default function StoolCheckScreen() {
  const router = useRouter();
  const { reading, capture, reset, isScoring } = useStoolCheckController();

  return (<Screen edges="none">
      <ScreenHeader subtitle="Photograph the bowl. It is not saved." />

      {reading === null ? (<>
          <View style={styles.viewfinder}>
            <Ionicons name="camera-outline" size={40} color={colors.textFaint} />
            <Text variant="callout" tone="muted" center>
              Photograph the bowl from directly above, with the light on.
            </Text>
          </View>
          <Card>
            <Overline>Before you do</Overline>
            <Text variant="callout" tone="muted" style={styles.gapTop}>
              The photo is read on the spot and then discarded. It is not saved to your phone, not
              added to your record, and no person sees it.
            </Text>
          </Card>
          <Button
            label="Take the photo"
            icon="camera"
            size="lg"
            fullWidth
            loading={isScoring}
            onPress={capture}
          />
        </>
) : (<>
          <ReadingResult reading={reading} />
          <ScaleChart current={reading.point} />

          <Card style={styles.limit}>
            <View style={styles.limitRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.alert} />
              <Text variant="bodyStrong" tone="alert">
                {NEVER[1].rule}
              </Text>
            </View>
            <Text variant="callout" tone="muted">
              {NEVER[1].because} {NEVER[0].because}
            </Text>
          </Card>

          <Button
            label="Speak to someone about this"
            variant="alert"
            fullWidth
            icon="call-outline"
            onPress={() => router.push('/safety')}
          />
          <Button label="Check again later" variant="ghost" fullWidth onPress={reset} />
        </>
)}
    </Screen>
);
}

function ReadingResult({ reading }: { reading: StoolReading }) {
  if (reading.inconclusive) {
    return (<Card>
        <Text variant="heading">I cannot tell from this photo</Text>
        <Text variant="body" tone="muted" style={styles.gapTop}>
          Try again with more light, or ask instead. A guess here would not help you.
        </Text>
      </Card>
);
  }

  const point = SCALE[reading.point];
  const ink = point.clear ? flagColours.green.ink : flagColours.amber.ink;
  const tint = point.clear ? flagColours.green.tint : flagColours.amber.tint;

  return (<Card style={{ backgroundColor: tint, borderColor: ink }}>
      <Overline style={{ color: ink }}>Point {reading.point} of 5</Overline>
      <Text variant="title" style={{ color: ink }}>
        {point.label}
      </Text>
      <Text variant="body" style={styles.gapTop}>
        {point.meaning}
      </Text>
      <View style={styles.gapTop}>
        <Confidence value={reading.confidence} />
      </View>
    </Card>
);
}

/**
 * The scale, drawn rather than photographed.
 *
 * Illustration on purpose: a row of photographs of the real thing is what makes
 * a patient put the phone down, and the point of this screen is that they do
 * not. The swatches carry the information (how clear, how much sediment) without the picture.
 */
function ScaleChart({ current }: { current: BowelScalePoint }) {
  const points: BowelScalePoint[] = [1, 2, 3, 4, 5];
  const swatches = ['#8A6A3A', '#B08A4E', '#CBA765', '#E3CE8E', '#F2E6B4'];

  return (<Card>
      <Overline>The scale your hospital uses</Overline>
      <View style={styles.scaleRow}>
        {points.map((point, i) => (<View key={point} style={styles.scaleCell}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: swatches[i] },
                point === current && styles.swatchCurrent,
              ]}
            />
            <Text variant="caption" tone={point === current ? 'default' : 'faint'} center>
              {point}
            </Text>
          </View>
))}
      </View>
      <Text variant="callout" tone="muted">
        Most departments are looking for 4 or 5 by the time you leave home. Yours may differ.
        The number on your letter is the one that counts.
      </Text>
    </Card>
);
}

const styles = StyleSheet.create({
  viewfinder: {
    aspectRatio: 1,
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
  gapTop: { marginTop: spacing.sm },
  scaleRow: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.md },
  scaleCell: { flex: 1, gap: spacing.xs, alignItems: 'center' },
  swatch: {
    width: '100%',
    height: 46,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  swatchCurrent: { borderWidth: 3, borderColor: colors.text },
  limit: { gap: spacing.sm, borderColor: colors.alertSoft },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
