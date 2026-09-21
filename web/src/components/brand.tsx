/**
 * The marks, ported from the Expo app.
 *
 * Geometry is copied verbatim off `colonaid/src/views/components/AppLogo.tsx` and
 * `Wordmark.tsx` — the same 120 grid, the same 13 strokes — so the web app and
 * the native app cannot drift into being two different brands. If the mark
 * changes there, regenerate here rather than nudging by eye.
 */
// ---------------------------------------------------------------------------
// The mark
// ---------------------------------------------------------------------------
/**
 * A solid C with a hairline arc running outside it: the same curve stated
 * twice, once with weight and once without. The echo is what stops it being a
 * letter and starts it being a mark.
 *
 * The body is a filled annular sector rather than a stroked arc — a stroke is
 * uniform by construction, and filling frees the two curves to carry different
 * weights: a 15-unit band against a 5-unit hairline.
 */
const BODY = 'M97.43 29.53 A41 41 0 1 0 97.43 90.47 L87.4 79.32 A26 26 0 1 1 87.4 40.68 Z'
/**
 * The echo sweeps 110° against the body's 96°, so its terminals stop short on
 * both ends. Matched terminals would read as one fat concentric ring; only the
 * shortfall makes the eye read two passes of a single curve.
 */
const ECHO = 'M97.53 20.68 A48 48 0 1 0 97.53 99.32'
/**
 * The small form: the body alone, cut wider and heavier, no echo.
 *
 * Five units of hairline is under a pixel in a 16px browser tab, and a hairline
 * that half-renders is worse than one never drawn. Cut from a wider band (17
 * against 15) so dropping the echo does not take mass out of the mark.
 */
const COMPACT =
  'M97.45 26.19 A45.5 45.5 0 1 0 97.45 93.81 L86.07 81.18 A28.5 28.5 0 1 1 86.07 38.82 Z'
const COMPACT_BELOW = 32
export function ColonaidMark({
  size = 40,
  color = 'var(--color-blue)',
  className,
}: {
  size?: number
  color?: string
  className?: string
}) {
  const compact = size < COMPACT_BELOW
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Colonaid"
    >
      {compact ? (
        <path d={COMPACT} fill={color} />
      ) : (
        <>
          <path d={BODY} fill={color} />
          <path d={ECHO} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}
// ---------------------------------------------------------------------------
// The wordmark
// ---------------------------------------------------------------------------
/**
 * The lockup: the mark, then "olonaid".
 *
 * The mark already is a C, so it stands in as the word's first letter rather
 * than sitting beside a redundant one. Everything is a stroke — these letters
 * are monoline by construction, so the stroke is not a stand-in for the letter,
 * it *is* the letter.
 *
 * One colour throughout. Splitting a blue mark off near-black letters made the
 * C read as a separate object sitting beside a word, which is the opposite of
 * the point — it *is* the word's first letter. `markColor` still exists for the
 * reversed case, but it follows `color` unless something asks otherwise.
 *
 * The first two strokes are the mark: the body's centreline (radius 33.5, band
 * 15, butt caps so the terminals stay radial) and its echo. `markColor` splits
 * on that boundary.
 */
const MARK_STROKES = 2
const STROKES: { d: string; w: number; cap: 'butt' | 'round' }[] = [
  { d: 'M92.42 35.10 A33.5 33.5 0 1 0 92.42 84.90', w: 15, cap: 'butt' },
  { d: 'M97.53 20.68 A48 48 0 1 0 97.53 99.32', w: 5, cap: 'round' },
  { d: 'M165 79.5 A21.5 21.5 0 1 1 122 79.5 A21.5 21.5 0 1 1 165 79.5', w: 13, cap: 'round' },
  { d: 'M190 22 L190 101', w: 13, cap: 'round' },
  { d: 'M258 79.5 A21.5 21.5 0 1 1 215 79.5 A21.5 21.5 0 1 1 258 79.5', w: 13, cap: 'round' },
  { d: 'M283 58 L283 101', w: 13, cap: 'round' },
  { d: 'M283 79.5 A21.5 21.5 0 0 1 326 79.5 L326 101', w: 13, cap: 'round' },
  { d: 'M394 79.5 A21.5 21.5 0 1 1 351 79.5 A21.5 21.5 0 1 1 394 79.5', w: 13, cap: 'round' },
  { d: 'M394 58 L394 101', w: 13, cap: 'round' },
  { d: 'M419 58 L419 101', w: 13, cap: 'round' },
  { d: 'M419 39 L419 39.6', w: 13, cap: 'round' },
  { d: 'M487 79.5 A21.5 21.5 0 1 1 444 79.5 A21.5 21.5 0 1 1 487 79.5', w: 13, cap: 'round' },
  { d: 'M487 22 L487 101', w: 13, cap: 'round' },
]
const VIEW_BOX = '18 6 488 132'
const RATIO = 488 / 132
export function Wordmark({
  width = 132,
  color = 'var(--color-blue)',
  markColor = color,
  className,
}: {
  width?: number
  color?: string
  /** The mark alone, when it should differ from the letters. Defaults to `color`. */
  markColor?: string
  className?: string
}) {
  return (
    <svg
      width={width}
      height={width / RATIO}
      viewBox={VIEW_BOX}
      className={className}
      role="img"
      aria-label="Colonaid"
    >
      {STROKES.map((s, i) => (
        <path
          key={s.d}
          d={s.d}
          stroke={i < MARK_STROKES ? markColor : color}
          strokeWidth={s.w}
          fill="none"
          strokeLinecap={s.cap}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
// ---------------------------------------------------------------------------
// The hospital's marks
// ---------------------------------------------------------------------------
