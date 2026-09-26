import type { StoolCheck } from '@/domain/stool-check'

/**
 * Reference pictures for the stool check-in: the toilet bowl seen from above.
 *
 * Drawn rather than photographed so the set is consistent, loads instantly on
 * a hospital guest network, and is not distressing to look at at 1am. Each
 * option is drawn in the colour the patient chose in the previous question, so
 * what they compare against looks like what they are looking at. They are a
 * guide to the words beside them, not a diagnostic scale.
 */

type Kind = StoolCheck['consistency'] | NonNullable<StoolCheck['clarity']>

/** Liquid tint when no colour has been chosen, or it was "I cannot tell". */
const DEFAULT_TINT = '#E9C98A'
const SOLID = '#8A6238'

export function StoolPicture({ kind, tint = DEFAULT_TINT, size = 64 }: { kind: Kind; tint?: string; size?: number }) {
  if (kind === 'unsure') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
        <circle cx="32" cy="32" r="29" fill="#FFFFFF" stroke="#C9CDD2" strokeWidth="2" />
        <circle cx="32" cy="34" r="21" fill="#EEF1F3" />
        <text x="32" y="42" textAnchor="middle" fontSize="24" fontWeight="700" fill="#8A9097">?</text>
      </svg>
    )
  }

  // Cloudy and solid-bearing water is opaque; watery and see-through is not.
  const opacity = kind === 'watery' || kind === 'clear' ? 0.45 : kind === 'flecks' ? 0.6 : 0.9
  const showFloor = kind === 'watery' || kind === 'clear'

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      {/* the bowl rim and water */}
      <circle cx="32" cy="32" r="29" fill="#FFFFFF" stroke="#C9CDD2" strokeWidth="2" />
      <circle cx="32" cy="34" r="21" fill="#F4F6F7" />
      {/* the drain, only visible through see-through liquid */}
      {showFloor ? <ellipse cx="32" cy="40" rx="7" ry="4" fill="#B9C0C6" /> : null}
      <circle cx="32" cy="34" r="21" fill={kind === 'solid' ? '#DCE6EA' : tint} opacity={kind === 'solid' ? 0.6 : opacity} />

      {kind === 'solid' ? (
        <g fill={SOLID}>
          <rect x="17" y="26" width="24" height="8" rx="4" transform="rotate(-18 29 30)" />
          <rect x="26" y="36" width="20" height="7.5" rx="3.75" transform="rotate(12 36 40)" />
        </g>
      ) : null}

      {kind === 'pieces' ? (
        <g fill={SOLID}>
          <circle cx="24" cy="28" r="3.6" />
          <circle cx="38" cy="26" r="2.8" />
          <circle cx="30" cy="38" r="4" />
          <circle cx="42" cy="38" r="3" />
          <circle cx="21" cy="40" r="2.4" />
          <circle cx="33" cy="30" r="2" />
        </g>
      ) : null}

      {kind === 'flecks' ? (
        <g fill={SOLID} opacity="0.85">
          <circle cx="25" cy="30" r="1.2" />
          <circle cx="37" cy="28" r="1" />
          <circle cx="31" cy="39" r="1.3" />
          <circle cx="41" cy="37" r="0.9" />
        </g>
      ) : null}

      {/* a highlight, so clear liquid reads as liquid rather than an empty bowl */}
      {kind !== 'solid' ? <path d="M20 27 q6 -6 14 -6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" /> : null}
    </svg>
  )
}
