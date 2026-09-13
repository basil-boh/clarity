import { StyleSheet, View } from 'react-native';

import { Card, FlagBadge, Overline, Screen, ScreenHeader, Stagger, Text } from '@/views/components/ui';
import { FLAG_MEANING, UNMEASURED, WEIGHTS } from '@/models/flag/flag.rules';
import { useFlagController } from '@/controllers/useFlagController';
import type { FlagSignals } from '@/models/prep/prep.types';
import { colors, flag as flagColours, radius, spacing } from '@/theme';

/**
 * The prep summary (feature 09).
 *
 * Four of the seven staff CW12 spoke to chose a single flag over seeing food or
 * stool photographs, and the reason was triage speed on a morning list. But a
 * flag with no basis is only a different guess, so this screen shows the colour
 * first and the four signals behind it immediately after, on the same page. The
 * nurse should be able to disagree with it in five seconds.
 *
 * One screen, two readers. The patient opens it from Today; the nurse reads it
 * over the patient's shoulder at admission. `FLAG_MEANING` carries a sentence
 * for each, and both are shown: a summary the patient cannot read is a summary
 * they will not bring.
 *
 * The signal rows are honest about what was never measured. A patient who
 * simply did not use the app has not failed their preparation, and a red flag
 * built out of silence would teach the ward to ignore the colour within a week.
 */

const SIGNAL_LABELS: Record<keyof FlagSignals, { name: string; source: string }> = {
  dietCompliance: { name: 'Diet compliance', source: 'From the meals you logged and checked' },
  prepTiming: { name: 'Prep timing', source: 'From when each dose was actually finished' },
  fluidIntake: { name: 'Fluid intake', source: 'From the clear fluids you recorded' },
  bowelOutput: { name: 'Bowel output', source: 'From the checks against the hospital scale' },
};

export default function FlagScreen() {
  const { flag: data } = useFlagController();

  return (<Screen edges="none">
      <ScreenHeader subtitle="Show this at admission." />

      {data ? (<Stagger>
          <Card
            key="flag"
            style={{ backgroundColor: flagColours[data.colour].tint, borderColor: flagColours[data.colour].ink }}
          >
            <FlagBadge colour={data.colour} />
            <Text variant="body" style={styles.gapMd}>
              {FLAG_MEANING[data.colour].patient}
            </Text>
          </Card>

          <View key="signals" style={styles.signals}>
            <Overline>What this is built from</Overline>
            {(Object.keys(SIGNAL_LABELS) as (keyof FlagSignals)[]).map((key) => (<SignalRow key={key} signal={key} value={data.signals[key]} />
))}
          </View>

          {data.reasons.length > 0 ? (<Card key="reasons">
              <Overline>Worth mentioning</Overline>
              <View style={styles.reasons}>
                {data.reasons.map((reason) => (<Text key={reason} variant="body">
                    · {reason}
                  </Text>
))}
              </View>
            </Card>
) : null}

          <Card key="nurse" style={styles.nurse}>
            <Overline>For the nurse</Overline>
            <Text variant="body" style={styles.gapSm}>
              {FLAG_MEANING[data.colour].nurse}
            </Text>
            <Text variant="caption" tone="faint" style={styles.gapMd}>
              Compiled by the patient&rsquo;s app from self-reported diet, dose timing, fluid volume
              and photo-assessed output. Not a clinical assessment, and no photograph was retained.
              Weighting: timing and output {Math.round(WEIGHTS.prepTiming * 100)}% each, diet{' '}
              {Math.round(WEIGHTS.dietCompliance * 100)}%, fluids{' '}
              {Math.round(WEIGHTS.fluidIntake * 100)}%.
            </Text>
          </Card>
        </Stagger>
) : null}
    </Screen>
);
}

/**
 * One signal.
 *
 * An unmeasured signal gets a hatched, empty track and the words "not
 * recorded", never a zero-width bar: an empty bar and a bar at zero look
 * identical and mean opposite things.
 */
function SignalRow({ signal, value }: { signal: keyof FlagSignals; value: number }) {
  const { name, source } = SIGNAL_LABELS[signal];
  const measured = value !== UNMEASURED && value >= 0;
  const percent = measured ? Math.round(value * 100) : 0;

  return (<View style={styles.signal}>
      <View style={styles.signalHead}>
        <Text variant="bodyStrong">{name}</Text>
        <Text variant="caption" tone={measured ? 'muted' : 'faint'}>
          {measured ? `${percent}%` : 'Not recorded'}
        </Text>
      </View>
      <View style={[styles.track, !measured && styles.trackEmpty]}>
        {measured ? <View style={[styles.fill, { width: `${percent}%` }]} /> : null}
      </View>
      <Text variant="caption" tone="faint">
        {source}
      </Text>
    </View>
);
}

const styles = StyleSheet.create({
  gapSm: { marginTop: spacing.xs },
  gapMd: { marginTop: spacing.md },
  signals: { gap: spacing.lg },
  signal: { gap: spacing.xs },
  signalHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  track: {
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.cardSunken,
    overflow: 'hidden',
  },
  trackEmpty: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: 'transparent' },
  fill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  reasons: { gap: spacing.xs, marginTop: spacing.sm },
  nurse: { backgroundColor: colors.cardSunken },
});
