import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { Text } from './text';

export type Phase = {
  key: string;
  label: string;
  state: 'done' | 'now' | 'upcoming';
  /** The colour this phase wears on the calendar, so the two agree. */
  tone?: string;
  /** Readable ink for that colour, used by the "you are here" line. */
  ink?: string;
  /** The dates this phase covers, e.g. "11–12 Sep". */
  dates?: string;
  /**
   * The unabbreviated name, for the "you are here" line. The segment labels are
   * clipped to fit five across ("Diet"); the line below has room for the name a
   * patient was actually given ("Low-residue diet").
   */
  fullLabel?: string;
};

/**
 * The run-up, as a row of segments, plus an unambiguous statement of where you
 * are.
 *
 * A patient's first question is not "what do I do" but "where am I": the sheet
 * was handed over up to two years ago and the phases have names nobody
 * remembers.
 *
 * Every segment is the same size. Making the current one taller was tried and
 * removed: five bars of different heights read as five *quantities* being
 * compared (as if the diet phase were somehow larger than the purge night) when they are five equal steps and only one of them is where you are. A
 * caret above the active segment says "here" without implying "more".
 *
 * Where you are is therefore stated three ways, none of them size: the caret,
 * the label in the phase colour, and the line underneath in words. Redundant on
 * purpose: the caret is the glance, the line is the answer.
 *
 * Each segment wears the colour that phase wears on the calendar behind it, at
 * full strength. Dimming the upcoming ones was tried and reverted: at low
 * opacity the navy purge night and the blue procedure day collapsed into the
 * same grey, and the strip stopped distinguishing phases at all.
 */
export function PhaseStrip({ phases }: { phases: readonly Phase[] }) {
  const current = phases.find((phase) => phase.state === 'now');

  return (<View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={
        current
          ? `You are in: ${current.fullLabel ?? current.label}${current.dates ? `, ${current.dates}` : ''}`
          : 'Preparation timeline'
      }
      style={styles.wrap}
    >
      {/* The marker sits in its own row so the bars below stay identical. */}
      <View style={styles.markers}>
        {phases.map((phase) => (<View key={phase.key} style={styles.slot}>
            {phase.state === 'now' ? (<View
                style={[styles.caret, { borderTopColor: phase.ink ?? colors.text }]}
                // Decorative: the phase is announced by the wrapper's label and
                // spelled out in the line below.
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              />
) : null}
          </View>
))}
      </View>

      <View style={styles.track}>
        {phases.map((phase) => (<View key={phase.key} style={styles.slot}>
            <View
              style={[styles.segment, phase.tone ? { backgroundColor: phase.tone } : null]}
            />
          </View>
))}
      </View>

      <View style={styles.labels}>
        {phases.map((phase) => (<Text
            key={phase.key}
            variant="overline"
            numberOfLines={1}
            style={[
              styles.label,
              { color: phase.state === 'now' ? (phase.ink ?? colors.text) : colors.textFaint },
            ]}
          >
            {phase.label}
          </Text>
))}
      </View>

      {current ? (<View style={styles.nowRow}>
          <View style={[styles.nowDot, { backgroundColor: current.tone ?? colors.primary }]} />
          <Text variant="caption" style={styles.nowLabel}>
            You are here: {(current.fullLabel ?? current.label).toLowerCase()}
          </Text>
          {current.dates ? (<Text variant="caption" tone="faint">
              {current.dates}
            </Text>
) : null}
        </View>
) : null}
    </View>
);
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  markers: { flexDirection: 'row', gap: 4, height: 7 },
  track: { flexDirection: 'row', gap: 4 },
  slot: { flex: 1, alignItems: 'center' },
  segment: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.cardSunken,
  },
  // The classic border trick: a zero-size box whose top border is the triangle.
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  labels: { flexDirection: 'row', gap: 4 },
  label: { flex: 1, textAlign: 'center', textTransform: 'uppercase' },

  nowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.cardSunken,
  },
  nowDot: { width: 9, height: 9, borderRadius: radius.full },
  nowLabel: { flex: 1, color: colors.text },
});
