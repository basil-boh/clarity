import { addDays, format, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTodayController } from '@/controllers/useTodayController';
import { Wordmark } from '@/views/components/Wordmark';
import { FLAG_MEANING, UNMEASURED, WEIGHTS } from '@/models/flag/flag.rules';
import type { FlagSignals, PlanDay, Step } from '@/models/prep/prep.types';
import { Icon, type IconName } from '@/views/components/icons';
import { PrepCarousel } from '@/views/components/PrepCarousel';
import {
  FlagBadge,
  Hero,
  InstitutionLockup,
  Meter,
  Notice,
  Overline,
  PhaseStrip,
  QueryBoundary,
  Screen,
  Text,
  Timeline,
  TimelineRow,
  type Phase,
} from '@/views/components/ui';
import {
  colors,
  flag as flagColours,
  fonts,
  night,
  phaseRamp,
  radius,
  signalTones,
  spacing,
} from '@/theme';

/**
 * Today.
 *
 * The screen answers one question (*what do I do now*) and its shape is a
 * deliberate descent in weight rather than a stack of equal cards:
 *
 *   1. a dark hero, for where you are in the run-up;
 *   2. a phase strip, for how far through;
 *   3. a connected timeline, for what happens next;
 *   4. a low strip of meters, for how it is going;
 *   5. the carousel, which teaches rather than instructs;
 *   6. a quiet inline row, for the route to a person.
 *
 * Six patterns, in falling order of urgency. The previous version was four
 * white cards and a carousel, which gave a dose at 6pm and a footnote about
 * disclaimers exactly the same visual weight.
 *
 * The carousel sits fifth on purpose: it is what a patient in the two-year wait
 * spends time in, and what a patient on the purge night should scroll past.
 */
export default function TodayScreen() {
  const router = useRouter();
  const { profile, procedure, plan, flag, error, refetch } = useTodayController();

  return (<Screen>
      <QueryBoundary
        error={error}
        data={plan}
        onRetry={refetch}
        loadingLabel="Checking your plan…"
      >
        {(data) => (<>
            <Hero
              key="hero"
              eyebrow={profile ? `Hello, ${profile.displayName}` : 'Your preparation'}
              aside={
                <View style={styles.heroBrand}>
                  <Wordmark size={90} color={night.primary} animate={false} />
                  <InstitutionLockup />
                </View>
              }
              footer={
                procedure ? (<View style={styles.heroFooter}>
                    <Text variant="callout" style={styles.heroPlace}>
                      {procedure.hospital}
                    </Text>
                    <View style={styles.heroMeta}>
                      <Icon name="clock" size={14} color="rgba(255,255,255,0.66)" />
                      <Text variant="caption" style={styles.heroMetaText}>
                        Arrive {procedure.arriveAt}
                        {procedure.location ? ` · ${procedure.location}` : ''}
                      </Text>
                    </View>
                  </View>
) : null
              }
            >
              <View style={styles.heroHead}>
                <Text variant="clock" style={styles.heroCount}>
                  {countdown(data.offset).value}
                </Text>
                <Text variant="heading" style={styles.heroUnit}>
                  {countdown(data.offset).unit}
                </Text>
              </View>
              <Text variant="subheading" style={styles.heroTitle}>
                {data.today?.heading ?? 'Your preparation'}
              </Text>
            </Hero>

            {/*
              The strip says which phase; the calendar says which day. Both are
              wanted, and the second is a whole screen, so the strip carries the
              affordance rather than a separate row of buttons.
            */}
            <Pressable
              key="phases"
              onPress={() => router.push('/calendar')}
              accessibilityRole="button"
              accessibilityLabel="See all your dates on a calendar"
              style={({ pressed }) => [styles.phases, pressed && styles.pressed]}
            >
              <View style={styles.phasesHead}>
                <Overline>Your timeline</Overline>
                <View style={styles.phasesLink}>
                  <Icon name="calendar-days" size={15} color={colors.primary} />
                  <Text variant="caption" tone="primary">
                    All dates
                  </Text>
                </View>
              </View>
              <PhaseStrip phases={phasesFor(data.offset, procedure?.date)} />
            </Pressable>

            {data.today && data.today.steps.length > 0 ? (<View key="next" style={styles.block}>
                <Overline>What happens next</Overline>
                <Timeline style={styles.timeline}>
                  {orderSteps(data.today).map((step, index, all) => (<TimelineRow
                      key={step.id}
                      time={step.at}
                      title={step.title}
                      detail={step.detail}
                      // The first open step is the one to act on, whatever its
                      // weight. Keying `now` off `critical` alone left diet
                      // days (which have no critical steps) with nothing
                      // highlighted at all, so the rail read as a flat list.
                      state={index === 0 ? 'now' : 'upcoming'}
                      accent={step.weight === 'critical' ? flagColours.amber.ink : colors.primary}
                      last={index === all.length - 1}
                    />
))}
                </Timeline>
              </View>
) : (<Notice
                key="waiting"
                icon="clock"
                title="Nothing to do yet"
                detail="Your diet starts three days before. We will tell you when."
              />
)}

            {flag ? (<View key="flag" style={styles.flagStrip}>
                <View style={styles.flagHead}>
                  <FlagBadge colour={flag.colour} />
                  <Text variant="caption" tone="primary" onPress={() => router.push('/flag')}>
                    See summary
                  </Text>
                </View>
                <Text variant="callout" tone="muted">
                  {FLAG_MEANING[flag.colour].patient}
                </Text>
                <SignalRows signals={flag.signals} />
              </View>
) : null}

            <PrepCarousel key="carousel" onPressSlide={() => router.push('/(tabs)/diet')} />

            <Notice
              key="safety"
              icon="phone-call"
              title="Worried right now?"
              detail="Who to call, and when not to wait for the app"
              href="/safety"
              tone="alert"
            />
          </>
)}
      </QueryBoundary>
    </Screen>
);
}

// ---------------------------------------------------------------------------

/** The big number in the hero, and the word under it. */
function countdown(offset: number): { value: string; unit: string } {
  if (offset === 0) return { value: 'Today', unit: '' };
  if (offset > 0) return { value: 'Done', unit: '' };
  const days = Math.abs(offset);
  return { value: String(days), unit: days === 1 ? 'day to go' : 'days to go' };
}

/**
 * The run-up in five named stretches.
 *
 * Named rather than numbered because "D-3" means nothing to someone handed a
 * sheet eighteen months ago. Each stretch carries the colour and the dates it
 * wears on the calendar, so tapping through to that screen shows the same key
 * rather than a second one to learn.
 */
function phasesFor(offset: number, procedureDate: string | undefined): Phase[] {
  const marks = [
    { key: 'wait', label: 'Wait', from: -Infinity, to: -8, tone: phaseRamp.waiting },
    { key: 'week', label: 'Run-up', from: -7, to: -4, tone: phaseRamp.week_before },
    { key: 'diet', label: 'Diet', from: -3, to: -2, tone: phaseRamp.diet_day },
    { key: 'purge', label: 'Purge', from: -1, to: -1, tone: phaseRamp.purge_night },
    { key: 'day', label: 'Scope', from: 0, to: Infinity, tone: phaseRamp.procedure_day },
  ];

  return marks.map((mark) => ({
    key: mark.key,
    label: mark.label,
    fullLabel: mark.tone.label,
    tone: mark.tone.surface,
    // The dark phases need their own ink for the "you are here" line; the light
    // ones would be unreadable in white.
    ink: mark.tone.onDark ? mark.tone.surface : mark.tone.ink,
    dates: procedureDate ? spanLabel(procedureDate, mark.from, mark.to) : undefined,
    state: offset > mark.to ? 'done' : offset >= mark.from ? 'now' : 'upcoming',
  }));
}

/** "11–12 Sep", "13 Sep", or nothing for the open-ended stretches. */
function spanLabel(procedureDate: string, from: number, to: number): string | undefined {
  if (!Number.isFinite(from) || !Number.isFinite(to)) return undefined;
  const procedure = parseISO(procedureDate);
  const start = addDays(procedure, from);
  const end = addDays(procedure, to);
  return from === to ? format(start, 'EEE d MMM') : `${format(start, 'd')}–${format(end, 'd MMM')}`;
}

/**
 * Critical steps first, then the rest.
 *
 * Not time order. A patient scanning at 6pm needs the dose before the reminder
 * to arrange a lift home, and time order does not reliably put it there.
 */
function orderSteps(day: PlanDay): Step[] {
  const open = day.steps.filter((step) => !step.done);
  return [
    ...open.filter((step) => step.weight === 'critical'),
    ...open.filter((step) => step.weight !== 'critical'),
  ];
}

/**
 * The four signals, in the order `computeFlag` weights them.
 *
 * Each gets an icon and a tone of its own. As four identical blue bars they
 * read as one four-part quantity; as four distinguishable rows a reader can
 * find "timing" without reading the labels, which matters, because timing and
 * output are the two that actually decide what the endoscopist will see.
 */
const SIGNALS: {
  key: keyof FlagSignals;
  label: string;
  icon: IconName;
  weight: number;
}[] = [
  { key: 'prepTiming', label: 'Timing', icon: 'alarm-clock', weight: WEIGHTS.prepTiming },
  { key: 'bowelOutput', label: 'Output', icon: 'toilet', weight: WEIGHTS.bowelOutput },
  { key: 'dietCompliance', label: 'Diet', icon: 'utensils-crossed', weight: WEIGHTS.dietCompliance },
  { key: 'fluidIntake', label: 'Fluids', icon: 'droplets', weight: WEIGHTS.fluidIntake },
];

/**
 * The signal rows under the flag.
 *
 * A percentage is shown where one was measured and the word "Not recorded"
 * where none was, never a zero-width bar, because an empty bar and a bar at
 * zero look identical and mean opposite things. A patient who never opened the
 * app has not failed their preparation.
 */
function SignalRows({ signals }: { signals: FlagSignals }) {
  return (<View style={styles.signals}>
      {SIGNALS.map((signal) => {
        const value = signals[signal.key];
        const measured = value !== UNMEASURED && value >= 0;
        const tone = signalTones[signal.key];

        return (<View key={signal.key} style={styles.signalRow}>
            <View style={[styles.signalIcon, { backgroundColor: tone.tint }]}>
              <Icon name={signal.icon} size={15} color={tone.ink} />
            </View>

            <View style={styles.signalBody}>
              <View style={styles.signalHead}>
                <Text variant="caption" style={{ color: colors.text }}>
                  {signal.label}
                </Text>
                <Text variant="caption" tone={measured ? 'muted' : 'faint'}>
                  {measured ? `${Math.round(value * 100)}%` : 'Not recorded'}
                </Text>
              </View>
              <Meter
                value={measured ? value : 0}
                unmeasured={!measured}
                tint={tone.ink}
                height={6}
              />
            </View>
          </View>
);
      })}
    </View>
);
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  phases: { gap: spacing.sm },
  phasesHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phasesLink: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pressed: { opacity: 0.6 },
  timeline: { paddingTop: spacing.xs },

  heroHead: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  heroCount: { color: '#FFFFFF' },
  heroUnit: { color: 'rgba(255,255,255,0.72)' },
  heroTitle: { color: '#FFFFFF', marginTop: 2 },
  heroFooter: { marginTop: spacing.sm, gap: 3 },
  // The brand column: the app's wordmark, then the hospital's marks under it.
  // Right-aligned because the lockups are different widths and a ragged left
  // edge against the panel's edge reads as a mistake.
  heroBrand: { alignItems: 'flex-end', gap: spacing.md },
  // A step down the scale from bodyStrong, with the semibold put back by hand.
  // The scale is a closed set and has no 15pt semi, but `Text` takes weight from
  // `fontFamily` by design, so this borrows the weight rather than inventing a
  // size — the venue stays the stronger of the two lines without being 17pt.
  heroPlace: { color: '#FFFFFF', fontFamily: fonts.semi },
  heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroMetaText: { color: 'rgba(255,255,255,0.66)' },

  flagStrip: {
    gap: spacing.sm,
    padding: spacing.lg - 2,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  flagHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  signals: { gap: spacing.md, marginTop: spacing.sm },
  signalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  signalIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalBody: { flex: 1, gap: 5 },
  signalHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
});
