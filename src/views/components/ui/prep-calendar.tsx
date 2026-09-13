import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { StyleSheet, View } from 'react-native';

import { offsetFor, phaseFor } from '@/models/prep/prep.schedule';
import type { Phase } from '@/models/prep/prep.types';
import { colors, phaseRamp, radius, spacing, type PhaseTone } from '@/theme';

import { Overline, Text } from './text';

/**
 * The run-up as a calendar.
 *
 * The phase strip on Today says *which* phase a patient is in; this says
 * *when*. That is a different question and it is the one asked at the referral
 * appointment, sometimes two years out: which days do I stop eating, which
 * night do I not sleep, when do I need someone to drive me. A five-segment bar
 * cannot answer any of those, and a paragraph of dates is not read.
 *
 * Weeks start on Monday, which is how a Singapore work week is counted and how
 * every printed hospital calendar here is laid out.
 *
 * The grid is a continuous run of weeks rather than a month view, so the diet
 * days and the procedure never fall across a month boundary into a second page.
 * Month names appear on the row where the month changes, which is what a reader
 * needs to orient and no more.
 */

/** Completeness is enforced here rather than in the theme, which has no domain types. */
const RAMP = phaseRamp satisfies Record<Phase, PhaseTone>;

/** How much of the run-up to show, in days either side of the procedure. */
const LEAD_IN = 17;
const TAIL = 6;

export function PrepCalendar({
  procedureDate,
  today = new Date(),
}: {
  procedureDate: string;
  today?: Date;
}) {
  const procedure = parseISO(procedureDate);

  const from = startOfWeek(addDays(procedure, -LEAD_IN), { weekStartsOn: 1 });
  const to = endOfWeek(addDays(procedure, TAIL), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: from, end: to });

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <View style={styles.calendar}>
      <View style={styles.weekdays}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((initial, index) => (
          <Text
            key={`${initial}-${index}`}
            variant="overline"
            tone="faint"
            style={styles.weekday}
          >
            {initial}
          </Text>
        ))}
      </View>

      {weeks.map((week) => {
        const first = week[0]!;
        // Label the row where a new month starts, and the very first row.
        const showsMonth =
          week.some((day) => day.getDate() === 1) || first === days[0];

        return (
          <View key={first.toISOString()} style={styles.weekBlock}>
            {showsMonth ? (
              <Overline style={styles.month}>
                {format(week.find((day) => day.getDate() === 1) ?? first, 'MMMM yyyy')}
              </Overline>
            ) : null}

            <View style={styles.week}>
              {week.map((day) => (
                <Day
                  key={day.toISOString()}
                  day={day}
                  procedureDate={procedureDate}
                  isToday={isSameDay(day, today)}
                  dimmed={!isSameMonth(day, procedure) && !isSameMonth(day, today)}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Day({
  day,
  procedureDate,
  isToday,
  dimmed,
}: {
  day: Date;
  procedureDate: string;
  isToday: boolean;
  dimmed: boolean;
}) {
  const phase = phaseFor(offsetFor(procedureDate, day));
  const tone = RAMP[phase];
  return (
    <View style={styles.cell}>
      <View
        style={[
          styles.pip,
          { backgroundColor: tone.surface },
          // "Today" is a ring, never a fill: a fill would compete with the
          // phase colour, which is the information the grid exists to carry.
          isToday && styles.pipToday,
          phase === 'done' && styles.pipDone,
          dimmed && !isToday && styles.pipDimmed,
        ]}
        accessible
        accessibilityLabel={`${format(day, 'EEEE d MMMM')}, ${tone.label}${isToday ? ', today' : ''}`}
      >
        <Text
          variant="caption"
          style={[
            { color: tone.ink },
            dimmed && !isToday && styles.dimmedText,
          ]}
        >
          {format(day, 'd')}
        </Text>
      </View>
    </View>
  );
}

/**
 * The key, with the actual dates against each colour.
 *
 * The ranges are derived by walking the same `phaseFor` the grid walks, rather
 * than by restating the boundaries here. Two copies of "the diet starts three
 * days before" is exactly the kind of duplication that survives one change to
 * the schedule and not the second.
 */
export function PhaseLegend({ procedureDate }: { procedureDate: string }) {
  const order: Phase[] = ['week_before', 'diet_day', 'purge_night', 'procedure_day'];
  const procedure = parseISO(procedureDate);

  const spans = new Map<Phase, Date[]>();
  for (let offset = -10; offset <= 0; offset += 1) {
    const day = addDays(procedure, offset);
    const phase = phaseFor(offset);
    const found = spans.get(phase);
    if (found) found.push(day);
    else spans.set(phase, [day]);
  }

  return (
    <View style={styles.legend}>
      {order.map((phase) => {
        const tone = RAMP[phase];
        const days = spans.get(phase) ?? [];
        const first = days[0];
        const last = days[days.length - 1];

        return (
          <View key={phase} style={styles.legendRow}>
            <View
              style={[
                styles.swatch,
                { backgroundColor: tone.surface },
                !tone.onDark && styles.swatchOutlined,
              ]}
            />
            <Text variant="caption" style={styles.legendLabel}>
              {tone.label}
            </Text>
            {first && last ? (
              <Text variant="caption" tone="faint">
                {first === last || isSameDay(first, last)
                  ? format(first, 'EEE d MMM')
                  : `${format(first, 'd')}–${format(last, 'd MMM')}`}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const CELL = 38;

const styles = StyleSheet.create({
  calendar: { gap: spacing.md },
  weekdays: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  weekBlock: { gap: spacing.sm },
  month: { color: colors.text },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center' },
  pip: {
    width: CELL,
    height: CELL,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipToday: { borderWidth: 2, borderColor: colors.text },
  pipDone: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pipDimmed: { opacity: 0.45 },
  dimmedText: { color: colors.textFaint },

  legend: { gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  legendLabel: { flex: 1, color: colors.text },
  swatch: { width: 22, height: 22, borderRadius: radius.sm },
  swatchOutlined: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
});
