import Svg, { Path, Rect } from 'react-native-svg';

import { palette } from '@/theme';

/**
 * The app mark.
 *
 * A solid C with a hairline arc running outside it: the same curve stated twice,
 * once with weight and once without. The echo is what stops the mark being a
 * letter and starts it being a mark — it reads as depth, or as a second pass of
 * the same movement, depending on how long you look at it.
 *
 * Flat `palette.blue` throughout, and that is a correction rather than a
 * preference. The mark this descends from was a gradient ring around a droplet;
 * two gradients across 15pt of stroke resolve to one muddy purple at launcher
 * size. A single flat tone also survives the places a clinical mark actually
 * ends up: a monochrome ward printer, a photocopied discharge sheet, a fax to
 * the endoscopy unit.
 *
 * Geometry lives on a 120 grid, drawn once here and rendered everywhere. The
 * onboarding, the launcher icon, the splash and the favicon are generated from
 * these same paths by `scripts/make-icons.mjs`, so they cannot drift.
 */

/**
 * The body is a *filled annular sector*, not a stroked arc, and that is the
 * whole reason this mark can exist. A stroke is uniform by construction and can
 * only end in a round or a square cap, so a stroked C and its echo would have
 * been forced to share a weight. Filling the body frees the two curves to be
 * different things: 15 units of band against a 5-unit hairline.
 *
 * Both are struck about x=70 rather than the grid's centre at 60. The aperture
 * removes ink from the right, so the form hangs visibly left without the
 * correction — it shows up as a gap in the onboarding lockup and as a lopsided
 * launcher icon. Ten units lands the ink's bounding box at 59.8.
 *
 * Endpoints are the angles evaluated at each radius: `x = 70 + r·cos θ`,
 * `y = 60 ∓ r·sin θ`. Regenerate them from that rather than nudging them by eye.
 * The mark this replaced carried an arc that had been hand-typed about a point
 * out, which tilted its gap, and nobody noticed for a month.
 */
const BODY = 'M97.43 29.53 A41 41 0 1 0 97.43 90.47 L87.4 79.32 A26 26 0 1 1 87.4 40.68 Z';

/**
 * The echo sweeps 110°, against the body's 96°, so its terminals stop *short* of
 * the body's on both ends rather than lining up with them. That offset is the
 * whole trick: matched terminals read as one fat concentric ring, and only the
 * shortfall makes the eye read two passes of a single curve.
 */
const ECHO = 'M97.53 20.68 A48 48 0 1 0 97.53 99.32';
const ECHO_WIDTH = 5;

/**
 * The small form: the body alone, cut wider and heavier, with no echo.
 *
 * Five units of hairline is a shade over one pixel at the 28pt a list row uses,
 * and under a pixel in a 16px browser tab — it does not survive, and a hairline
 * that half-renders is worse than one that was never drawn. So below
 * `COMPACT_BELOW` the echo goes.
 *
 * This is deliberately not the body scaled up. Dropping the echo takes mass out
 * of the mark, so the small form is cut from a wider band (17 units against 15)
 * on a larger radius, which puts that mass back. It is struck about x=67 rather
 * than 70 because a wider band with the same aperture removes less ink, and the
 * correction the full form needs would overshoot here.
 *
 * The two forms are never on screen together: the one place both sizes appear is
 * the onboarding, where the top bar's mark is held back until the reader has
 * left the title page that the large mark fills.
 */
const COMPACT =
  'M97.45 26.19 A45.5 45.5 0 1 0 97.45 93.81 L86.07 81.18 A28.5 28.5 0 1 1 86.07 38.82 Z';
const COMPACT_BELOW = 32;

/**
 * How much of the 120 grid each form's ink actually spans, for the icon
 * generator to scale against. Read from here rather than measured there, so a
 * change to the geometry cannot leave the launcher assets cropped or floating.
 */
const SPAN_FULL = 101;
const SPAN_COMPACT = 91;

// Every constant above is read out of this file *as text* by
// `scripts/make-icons.mjs`, which is what keeps the launcher art and the
// on-screen mark from drifting apart. Inlining one, renaming it, or computing it
// stops the script rather than silently reverting the icons — but it does stop
// the script, so re-point it if you move them.

export function AppLogo({
  size = 40,
  /** Draws the rounded tile behind the mark, as the launcher icon does. */
  tile = false,
  /** For the night surface and for the mark reversed out of a solid ground. */
  color = palette.blue,
}: {
  size?: number;
  tile?: boolean;
  color?: string;
}) {
  const compact = size < COMPACT_BELOW;

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Clarity">
      {tile ? <Rect width="120" height="120" rx="27" fill={palette.paperDim} /> : null}

      {compact ? (
        <Path d={COMPACT} fill={color} />
      ) : (
        <>
          <Path d={BODY} fill={color} />
          <Path
            d={ECHO}
            stroke={color}
            strokeWidth={ECHO_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}
