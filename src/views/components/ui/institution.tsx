import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { spacing } from '@/theme';

/**
 * The hospital's marks, in the brand column down the right of the Today hero,
 * under Colonaid's own wordmark.
 *
 * ── About the artwork ──────────────────────────────────────────────────────
 *
 * Derived from the official colour marks, not artwork issued by either brand
 * team. **The symbols keep their brand colour — SGH's green, SingHealth's
 * orange — and only the type reverses to white**, because it is the near-black
 * wordmark under each that disappears on `palette.night`, not the symbol.
 *
 * The SGH lockup could not be done by recolouring fills, because it is layered:
 * a solid green rounded square, a solid *white* square on top that leaves the
 * green showing only as a frame, then the "sgh" monogram in green over that.
 * Dropping that white square turns the first layer into a solid blob and
 * swallows the monogram. It is rebuilt instead by rendering the layers
 * separately and recombining them, so the symbol's field is genuinely
 * transparent and the panel shows through it. The generator is
 * `scripts/reverse-institution-marks.py`, kept so this is reproducible rather
 * than a one-off, with a FAITHFUL flag that keeps the white field instead.
 *
 * Replace both with the official reversed lockups when the brand teams supply
 * them. See `assets/brand/README.md`.
 *
 * Sized by WIDTH inside boxes with `resizeMode: 'contain'`: the SGH lockup is
 * drawn 200 × 60 and the SingHealth logo 358 × 277, so matching them on height
 * would leave the hospital's mark three times the width of the cluster's.
 *
 * Hidden from screen readers. The clinic's name is in text in the same panel,
 * so announcing the marks would read the same fact twice to somebody who cannot
 * see that they are a letterhead.
 */
export function InstitutionLockup({
  style,
  /**
   * The SingHealth corporate logo beneath the hospital's.
   *
   * The SGH file is the *endorsed* lockup — it already carries "SingHealth"
   * under a rule beneath the hospital name — so showing both states the cluster
   * twice. `false` renders the hospital's mark alone, which is what SingHealth's
   * own guidelines describe for a hospital-level surface.
   */
  cluster = true,
}: {
  style?: ViewStyle;
  cluster?: boolean;
}) {
  return (
    <View
      style={[styles.stack, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={require('../../../../assets/brand/sgh.png')}
        style={styles.hospital}
        resizeMode="contain"
      />
      {cluster ? (
        <Image
          source={require('../../../../assets/brand/singhealth.png')}
          style={styles.cluster}
          resizeMode="contain"
        />
      ) : null}
    </View>
  );
}

/** The column's width, which the hospital's lockup sets. */
export const INSTITUTION_WIDTH = 98;

const styles = StyleSheet.create({
  // Centred on the hospital's lockup, which is the wider of the two and so sets
  // the column's width. Ragging them right lines up nothing, and left-aligning
  // hangs the narrower cluster mark off one edge; centring reads as one stack.
  stack: { alignItems: 'center', gap: spacing.sm },
  hospital: { width: INSTITUTION_WIDTH, height: 29.4, transform: [{ translateX: 3 }] },
  // Nudged right of dead centre. The hospital's lockup carries its symbol on the
  // left and a three-line text block to the right, so its optical mass sits
  // right of its geometric middle; centring the cluster mark on the box leaves
  // it looking a touch left. `translateX` rather than a margin, so the shift is
  // exactly this many points and does not also change what the column centres.
  cluster: { width: 60, height: 46.4, transform: [{ translateX: 7 }] },
});
