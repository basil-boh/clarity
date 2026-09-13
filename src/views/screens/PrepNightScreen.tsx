import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { GLASS_ML, usePrepNightController } from '@/controllers/usePrepNightController';
import { NEVER } from '@/models/flag/flag.rules';
import type { Dose } from '@/models/prep/prep.types';
import { Icon } from '@/views/components/icons';
import {
  BrandMark,
  Button,
  Card,
  Meter,
  Notice,
  Overline,
  ProgressRing,
  Screen,
  Text,
  Timeline,
  TimelineRow,
} from '@/views/components/ui';
import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

/**
 * The purge night (features 06 and 07).
 *
 * ── Why a ring, and a rail ─────────────────────────────────────────────────
 *
 * The night has exactly one number that matters: how much of the preparation
 * has actually gone down. It used to be a small bar inside one of two identical
 * cards. It is now the centre of the screen with the clock inside it, because
 * at 1am "how much is left" and "what time is it" are the same question asked
 * twice.
 *
 * The two doses are a connected rail rather than two cards. Cards in a column
 * are a set; a rail is a sequence, and the second dose coming *after* the first
 * is the entire clinical point. It is the one most often skipped.
 *
 * ── On the light ground ────────────────────────────────────────────────────
 *
 * This screen was dark, on the argument that it is read in an unlit bathroom
 * between six in the evening and two in the morning. It now matches the rest of
 * the app at the project owner's direction. The dark tokens are still in the
 * theme under `night`, so reinstating it is a matter of swapping the palette
 * here rather than rebuilding the screen.
 */
export default function PrepNightScreen() {
  const router = useRouter();
  const { doses, clock, drinkGlass, undoGlass } = usePrepNightController();

  const totalMl = doses.reduce((sum, dose) => sum + dose.volumeMl, 0);
  const drunkMl = doses.reduce((sum, dose) => sum + dose.consumedMl, 0);
  const progress = totalMl === 0 ? 0 : drunkMl / totalMl;

  return (
    <Screen>
      <BrandMark />

      <View style={styles.head}>
        <Overline>The purge night</Overline>
      </View>

      {/* One number, the size it deserves. */}
      <View style={styles.ringWrap}>
        <ProgressRing
          progress={progress}
          size={232}
          thickness={16}
          track={colors.cardSunken}
          from="#7C93FF"
          to={colors.primary}
        >
          <Text variant="clock">{clock}</Text>
          <View style={styles.volumeRow}>
            <Text variant="volume" tone="primary">
              {drunkMl}
            </Text>
            <Text variant="callout" tone="muted">
              / {totalMl} ml
            </Text>
          </View>
        </ProgressRing>
      </View>

      <Text variant="callout" tone="muted" center style={styles.lead}>
        Keep drinking clear fluid alongside each dose.
      </Text>

      {/* The two doses, as a sequence, each carrying its own controls. */}
      <Timeline style={styles.timeline}>
        {doses.map((dose, index) => (
          <TimelineRow
            key={dose.id}
            time={`due ${dose.scheduledAt}`}
            title={dose.label}
            state={
              dose.consumedMl >= dose.volumeMl
                ? 'done'
                : index === doses.findIndex((d) => d.consumedMl < d.volumeMl)
                  ? 'now'
                  : 'upcoming'
            }
            last={index === doses.length - 1}
            trailing={
              <Text variant="caption" tone="muted">
                {dose.consumedMl} / {dose.volumeMl} ml
              </Text>
            }
          >
            <DoseControl dose={dose} onDrink={drinkGlass} onUndo={undoGlass} />
          </TimelineRow>
        ))}
      </Timeline>

      <Notice
        icon="camera"
        title="Is it working?"
        detail="Checked against your hospital's scale, with how sure it is."
        onPress={() => router.push('/check/stool')}
      />

      {/* The guardrails, restated where they matter most. At 1am, on the fourth
          trip, "should I just take more?" is the question this screen exists to
          answer, and the answer is no. */}
      <Card style={styles.never}>
        <Overline>What this app will never do</Overline>
        {NEVER.map((item) => (
          <View key={item.id} style={styles.neverRow}>
            <Icon name="ban" size={18} color={colors.textFaint} />
            <View style={styles.neverBody}>
              <Text variant="bodyStrong">{item.rule}</Text>
              <Text variant="callout" tone="muted">
                {item.because}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <Button
        label="I need to speak to someone"
        variant="alert"
        icon="call-outline"
        fullWidth
        onPress={() => router.push('/safety')}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------------------

/**
 * One dose's controls.
 *
 * The volume is the headline rather than the time, because "finish all of it"
 * is the instruction clinicians were unanimous about and the one that gets a
 * single line on the printed sheet. The meter is a measurement the patient
 * took, not a target the app set.
 */
function DoseControl({
  dose,
  onDrink,
  onUndo,
}: {
  dose: Dose;
  onDrink: (dose: Dose) => void;
  onUndo: (dose: Dose) => void;
}) {
  const fraction = Math.min(dose.consumedMl / dose.volumeMl, 1);
  const done = dose.consumedMl >= dose.volumeMl;

  return (
    <View style={styles.control}>
      <Meter value={fraction} height={10} />

      <View style={styles.controlActions}>
        <Button
          label={done ? 'Finished' : `One glass · ${GLASS_ML} ml`}
          variant="secondary"
          icon={done ? 'checkmark-done' : 'water-outline'}
          disabled={done}
          onPress={() => onDrink(dose)}
          style={styles.sip}
        />
        {dose.consumedMl > 0 && !done ? (
          <Text
            variant="caption"
            tone="muted"
            onPress={() => onUndo(dose)}
            accessibilityRole="button"
            accessibilityLabel={`Undo the last glass of ${dose.label}`}
            style={styles.undo}
          >
            Undo
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs },
  ringWrap: { alignItems: 'center', marginTop: spacing.xs },
  volumeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginTop: 2 },
  lead: { marginTop: -spacing.sm },

  timeline: { paddingTop: spacing.xs },
  control: { gap: spacing.md },
  controlActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  sip: { alignSelf: 'flex-start' },
  undo: { minHeight: MIN_TOUCH, textAlignVertical: 'center', paddingVertical: spacing.md },

  never: { gap: spacing.md, borderRadius: radius.lg },
  neverRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  neverBody: { flex: 1, gap: 2 },
});
