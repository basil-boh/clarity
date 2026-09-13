import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors, fonts } from '@/theme';

const { Trigger } = NativeTabs;
const { Icon, Label } = Trigger;

/**
 * Four tabs, named for the four phases of the journey rather than for the
 * features behind them. A patient on day two should be able to find where they
 * are without knowing that the stool check belongs to feature 07.
 *
 * This is the platform's own tab bar, not a React Native one, so on iOS 26 it
 * is Liquid Glass for free: the refraction, the selection capsule, the fade at
 * the scroll edge and the minimise-on-scroll morph all come from UIKit, and
 * none of them can be faked convincingly in JS. The trade is that the bar is
 * *declared* rather than styled: hand it an SF Symbol and a tint and let it be
 * native. `backgroundColor` and `blurEffect` are conspicuously absent for that
 * reason: setting either swaps the glass material out for a flat fill.
 *
 * Three consequences worth knowing before adjusting anything here:
 *
 * - iOS 26 renders *unselected* items in its own high-contrast monochrome so
 *   they stay legible against whatever is scrolling underneath the glass. The
 *   `default` colours below are therefore honoured on Android and quietly
 *   ignored on iOS; only the selected tint gets through. That is the platform's
 *   call, not a bug to work around.
 * - The bar floats over the content rather than sitting below it, and nothing
 *   needs padding for that: react-native-screens switches the first scroll view
 *   on each screen to `UIScrollViewContentInsetAdjustmentAutomatic`, so the
 *   bar's height and the home indicator are already accounted for.
 * - **Labels truncate rather than wrap.** That is the one real cost of going
 *   native here, and it lands on feature 02: the Tamil and Chinese labels are
 *   wider than the English, and "Prep night" is already the longest of the
 *   four. When the tab bar is localised, check it at the largest Dynamic Type
 *   setting in all four languages, and shorten the *label* rather than the
 *   screen title if one clips: `Label` and the heading inside the screen are
 *   independent.
 *
 * Icons stay outline when inactive and filled when active, which is the same
 * "you are here" cue the rest of the app uses, expressed as SF Symbol pairs.
 * Android gets Material symbols on a Material 3 bottom bar, which is the right
 * answer there for the same reason glass is the right answer here.
 */
export default function TabsLayout() {
  return (<NativeTabs
      iconColor={{ default: colors.textFaint, selected: colors.primary }}
      labelStyle={{
        default: { fontFamily: fonts.medium, color: colors.textFaint },
        selected: { fontFamily: fonts.medium, color: colors.primary },
      }}
      // The signature iOS 26 gesture: the bar collapses to a pill on the way
      // down a long list and springs back the moment the user reverses.
      minimizeBehavior="onScrollDown"
    >
      <Trigger name="index">
        <Icon
          sf={{ default: 'list.bullet.clipboard', selected: 'list.bullet.clipboard.fill' }}
          md="checklist"
        />
        <Label>Today</Label>
      </Trigger>

      {/* SF Symbols has no filled `fork.knife`, so this one carries the
          selected state on tint alone. */}
      <Trigger name="diet">
        <Icon sf="fork.knife" md="restaurant" />
        <Label>Diet</Label>
      </Trigger>

      <Trigger name="prep">
        <Icon sf={{ default: 'moon', selected: 'moon.fill' }} md="bedtime" />
        <Label>Prep night</Label>
      </Trigger>

      <Trigger name="ask">
        <Icon
          sf={{ default: 'bubble.left.and.text.bubble.right', selected: 'bubble.left.and.text.bubble.right.fill' }}
          md="chat"
        />
        <Label>Ask</Label>
      </Trigger>
    </NativeTabs>
);
}
