import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDietController } from '@/controllers/useDietController';
import { Icon, type IconName } from '@/views/components/icons';
import {
  BrandMark,
  Chip,
  ChipBed,
  Notice,
  Overline,
  SCREEN_PADDING_X,
  Screen,
  Stagger,
  TabRow,
  Text,
  type TabOption,
} from '@/views/components/ui';
import { categorical, colors, radius, spacing, type CategoricalKey } from '@/theme';

/**
 * The diet days (features 03 and 04).
 *
 * ── Why this is one panel and not four cards ───────────────────────────────
 *
 * The previous version rendered each food group as its own card, so the screen
 * was the same card four times with different nouns in it: the reader scrolled
 * past three of them to reach the one they wanted, and nothing on the page told
 * them how many there were. Now the groups are a tab row and only the selected
 * one is drawn. Same information, a quarter of the scroll, and the set is
 * visible at a glance.
 *
 * Foods are chips rather than a middot-joined sentence for the same reason: a
 * run-on line reads as a paragraph and scans as nothing, while a bed of chips
 * lets the eye land on one item.
 *
 * ── SCAFFOLD ───────────────────────────────────────────────────────────────
 * The groups below are a fixture. The real plan is generated per patient from
 * the profile and written in their language, which is why the "built for you"
 * line is load bearing: without it this is a leaflet with a nicer typeface.
 * ───────────────────────────────────────────────────────────────────────────
 */

type FoodGroup = {
  key: CategoricalKey;
  label: string;
  title: string;
  icon: IconName;
  allowed: string[];
  avoid: string[];
};

const GROUPS: FoodGroup[] = [
  {
    key: 'grains',
    label: 'Grains',
    title: 'Rice, noodles and bread',
    icon: 'wheat',
    allowed: ['White rice', 'Plain porridge', 'Mee hoon', 'White bread', 'Plain biscuits'],
    avoid: ['Brown rice', 'Wholemeal bread', 'Oats', 'Muesli', 'Barley'],
  },
  {
    key: 'protein',
    label: 'Protein',
    title: 'Meat, fish and eggs',
    icon: 'fish',
    allowed: ['Steamed fish', 'Chicken, no skin', 'Eggs', 'Tofu', 'Minced pork'],
    avoid: ['Anything with nuts', 'Tough or fatty cuts', 'Fish with bones in'],
  },
  {
    key: 'produce',
    label: 'Vegetables',
    title: 'Vegetables and fruit',
    icon: 'carrot',
    allowed: ['Clear soup', 'Well-cooked marrow', 'Peeled potato', 'Peeled pumpkin'],
    avoid: ['Skins and seeds', 'Leafy greens', 'Sweetcorn', 'Raw fruit', 'Beans'],
  },
  {
    key: 'fluids',
    label: 'Drinks',
    title: 'What to drink',
    icon: 'glass-water',
    allowed: ['Water', 'Clear tea', 'Strained barley', 'Isotonic drinks'],
    avoid: ['Milk', 'Anything red or purple', 'Juice with pulp'],
  },
];

/** The three rules that cut across every group. */
const RULES: { icon: IconName; label: string }[] = [
  { icon: 'nut', label: 'No nuts or seeds' },
  { icon: 'cookie', label: 'No skins or husks' },
  { icon: 'milk', label: 'No milk or cream' },
];

export default function DietScreen() {
  const router = useRouter();
  const { tailoredFor } = useDietController();
  const [active, setActive] = useState<CategoricalKey>('grains');

  const group = GROUPS.find((candidate) => candidate.key === active) ?? GROUPS[0]!;
  const accent = categorical[group.key];

  const tabs: TabOption[] = GROUPS.map((candidate) => ({
    key: candidate.key,
    label: candidate.label,
    icon: candidate.icon,
    ink: categorical[candidate.key].ink,
    tint: categorical[candidate.key].tint,
  }));

  return (<Screen>
      <Stagger>
        <BrandMark key="brand" />

        <View key="head" style={styles.head}>
          <Overline>The three diet days</Overline>
          <Text variant="display">Low residue</Text>
          {tailoredFor.length > 0 ? (<View style={styles.tailored}>
              <Icon name="sparkles" size={14} color={colors.primary} />
              <Text variant="callout" tone="muted">
                Built for you · {tailoredFor.join(', ')}
              </Text>
            </View>
) : null}
        </View>

        {/* The question patients actually ask, answered at the top. */}
        <Pressable
          key="check"
          onPress={() => router.push('/check/meal')}
          accessibilityRole="button"
          accessibilityLabel="Can I eat this? Photograph the plate."
          style={({ pressed }) => [styles.scan, pressed && styles.pressed]}
        >
          <View style={styles.scanFrame}>
            <Icon name="scan-line" size={26} color={colors.textOnAccent} />
          </View>
          <View style={styles.scanBody}>
            <Text variant="heading" tone="onAccent">
              “Can I eat this?”
            </Text>
            <Text variant="callout" style={styles.scanDetail}>
              Photograph the plate. It stays on your phone.
            </Text>
          </View>
        </Pressable>

        <View key="groups" style={styles.block}>
          <TabRow
            options={tabs}
            value={active}
            onChange={(key) => setActive(key as CategoricalKey)}
            bleed={SCREEN_PADDING_X}
          />

          <View style={[styles.panel, { borderColor: accent.tint }]}>
            <View style={styles.panelHead}>
              <View style={[styles.panelIcon, { backgroundColor: accent.tint }]}>
                <Icon name={group.icon} size={22} color={accent.ink} />
              </View>
              <Text variant="heading" style={styles.panelTitle}>
                {group.title}
              </Text>
            </View>

            <View style={styles.list}>
              <View style={styles.listHead}>
                <Icon name="check-check" size={15} color={accent.ink} />
                <Overline style={{ color: accent.ink }}>You can have</Overline>
              </View>
              <ChipBed>
                {group.allowed.map((item) => (<Chip key={item} label={item} tone="primary" />
))}
              </ChipBed>
            </View>

            <View style={styles.divider} />

            <View style={styles.list}>
              <View style={styles.listHead}>
                <Icon name="ban" size={15} color={colors.textFaint} />
                <Overline>Leave out</Overline>
              </View>
              <ChipBed>
                {group.avoid.map((item) => (<Chip key={item} label={item} tone="quiet" struck />
))}
              </ChipBed>
            </View>
          </View>
        </View>

        {/* Three rules that hold whichever group you are looking at. */}
        <View key="rules" style={styles.rules}>
          {RULES.map((rule) => (<View key={rule.label} style={styles.rule}>
              <Icon name={rule.icon} size={20} color={colors.textMuted} />
              <Text variant="caption" tone="muted" center>
                {rule.label}
              </Text>
            </View>
))}
        </View>

        <Notice
          key="ask"
          icon="hand-heart"
          title="Not on the list?"
          detail="Singapore food does not fit into four groups. Ask, or photograph it."
          onPress={() => router.push('/(tabs)/ask')}
        />
      </Stagger>
    </Screen>
);
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs },
  block: { gap: spacing.md },
  tailored: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },

  scan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
  scanFrame: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  scanBody: { flex: 1, gap: 2 },
  scanDetail: { color: 'rgba(255,255,255,0.82)' },
  pressed: { opacity: 0.75 },

  panel: {
    borderRadius: radius.xl,
    borderWidth: 2,
    backgroundColor: colors.card,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  panelIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelTitle: { flex: 1 },
  list: { gap: spacing.sm },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  rules: { flexDirection: 'row', gap: spacing.sm },
  rule: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.cardSunken,
  },
});
