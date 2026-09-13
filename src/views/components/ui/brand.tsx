import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Wordmark } from '@/views/components/Wordmark';
import { spacing } from '@/theme';

/**
 * The lockup at the top left of a page, as a signature.
 *
 * The same drawn logotype the onboarding title page uses, not the bare mark and
 * not the name set in Inter beside it. One graphic, one form of the brand,
 * everywhere it appears.
 *
 * Static. The title page draws itself on because it is the first second of the
 * app; a signature that redraws every time a tab is focused is a distraction on
 * a screen somebody opened to do something else.
 *
 * Hidden from screen readers: it is decoration here, and the screen's own title
 * is announced immediately after, which is what a reader landing on the page
 * actually wants.
 *
 * Not used on Today. That screen carries the same wordmark inside the dark
 * hero instead, reversed out in the top right corner, where it signs the card
 * rather than competing with it as a second heading above it.
 */
export function BrandMark({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[styles.row, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Wordmark size={118} animate={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', marginBottom: -spacing.xs },
});
