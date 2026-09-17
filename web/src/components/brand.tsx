import Image from 'next/image'

/**
 * The marks, ported from the Expo app.
 *
 * Geometry is copied verbatim off `clarity/src/views/components/AppLogo.tsx` and
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

export function ClarityMark({
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
      aria-label="Clarity"
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
 * The lockup: the mark, then "larity".
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
  { d: 'M126.50 22.00 L126.50 101.00', w: 13, cap: 'round' },
  { d: 'M194.50 79.50 A21.5 21.5 0 1 1 151.50 79.50 A21.5 21.5 0 1 1 194.50 79.50', w: 13, cap: 'round' },
  { d: 'M194.50 58.00 L194.50 101.00', w: 13, cap: 'round' },
  { d: 'M219.50 58.00 L219.50 101.00', w: 13, cap: 'round' },
  { d: 'M219.50 74.00 A16 16 0 0 1 239.91 58.62', w: 13, cap: 'round' },
  { d: 'M264.90 58.00 L264.90 101.00', w: 13, cap: 'round' },
  { d: 'M264.90 39.00 L264.90 39.60', w: 13, cap: 'round' },
  { d: 'M300.90 28.00 L300.90 90.00 A11 11 0 0 0 311.90 101.00', w: 13, cap: 'round' },
  { d: 'M289.90 58.00 L315.90 58.00', w: 13, cap: 'round' },
  { d: 'M340.90 58.00 L357.90 95.00', w: 13, cap: 'round' },
  { d: 'M374.90 58.00 L349.90 128.00', w: 13, cap: 'round' },
]

const VIEW_BOX = '18 6 377.40 132'
const RATIO = 2.8591

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
      aria-label="Clarity"
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

/**
 * SGH and SingHealth, on a dark ground — and the ground is not decoration.
 *
 * The artwork in `public/brand` is the **reversed** variant: the symbols keep
 * their brand colour but the type under each is white, because that is the part
 * that disappears on a dark panel. It has no dark pixels at all, so it can only
 * be shown on a dark ground. Re-deriving a light variant would mean generating
 * a new modification of someone else's trademark, which is exactly what
 * `public/brand/README.md` says to stop and get signed off first.
 *
 * `cluster` defaults to false on purpose: the SGH file is the *endorsed* lockup
 * and already carries "SingHealth" under a rule, so showing the corporate logo
 * beneath it states the cluster twice. SingHealth's own guidelines describe the
 * hospital mark alone for a hospital-level surface.
 *
 * Hidden from screen readers — the clinic is named in text beside it, and
 * announcing the marks reads the same fact twice to someone who cannot see that
 * this is a letterhead.
 */
export function InstitutionBar({ cluster = true }: { cluster?: boolean }) {
  return (
    <div aria-hidden className="bg-ink">
      <div className="mx-auto flex w-full max-w-[560px] items-center gap-4 px-5 py-2.5">
        <Image
          src="/brand/sgh.png"
          alt=""
          width={294}
          height={88}
          className="h-[26px] w-auto"
          priority
        />
        {cluster ? (
          <>
            <span className="h-6 w-px bg-white/20" />
            <Image
              src="/brand/singhealth.png"
              alt=""
              width={180}
              height={139}
              className="h-[28px] w-auto"
              priority
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

export function InstitutionLockup({ cluster = false }: { cluster?: boolean }) {
  return (
    <div
      aria-hidden
      className="flex items-center gap-5 rounded-xl bg-ink px-5 py-4"
    >
      <Image
        src="/brand/sgh.png"
        alt=""
        width={294}
        height={88}
        className="h-[30px] w-auto"
        priority={false}
      />
      {cluster ? (
        <Image
          src="/brand/singhealth.png"
          alt=""
          width={180}
          height={139}
          className="h-[34px] w-auto"
          priority={false}
        />
      ) : null}
    </div>
  )
}
