import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Line icons.
 *
 * From [Lucide](https://lucide.dev) (ISC licence: permissive, no attribution
 * required; the link is courtesy). Converted to `react-native-svg` elements at
 * build time rather than loaded as assets, so they tint, scale and tree-shake
 * like components instead of like images.
 *
 * These sit alongside Ionicons rather than replacing it. Ionicons carries the
 * interface furniture (chevrons, the tab bar, close buttons) and has no
 * vocabulary for wheat, a fish fillet or a glass of water. Those are the icons
 * that let the diet screen tell four food groups apart at a glance, and the
 * prep summary tell four signals apart, instead of repeating one shape.
 *
 * The set is pruned to what is actually used: the map below is a lookup, so an
 * unused entry is dead weight in the bundle rather than a harmless extra.
 *
 * Every icon is a 24×24 grid, stroked, `strokeWidth` 2 at nominal size. The
 * stroke scales inversely with `size`, so a 40px icon does not read as a
 * heavier weight than a 16px one: the usual giveaway that icons were resized
 * rather than designed.
 */

export type IconName = 
  | 'alarm-clock'
  | 'ban'
  | 'calendar-check'
  | 'calendar-days'
  | 'camera'
  | 'carrot'
  | 'check-check'
  | 'clock'
  | 'cookie'
  | 'droplets'
  | 'fish'
  | 'glass-water'
  | 'hand-heart'
  | 'milk'
  | 'nut'
  | 'phone-call'
  | 'scan-line'
  | 'sparkles'
  | 'toilet'
  | 'utensils-crossed'
  | 'wheat'
  | 'x';

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Overrides the size-derived stroke. Rarely needed. */
  strokeWidth?: number;
};

const NOMINAL = 24;

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth }: IconProps) {
  return (<Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth ?? (2 * NOMINAL) / size}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {GLYPHS[name]}
    </Svg>
);
}

const GLYPHS: Record<IconName, ReactNode> = {
  'alarm-clock': (<>
      <Circle key="0" cx="12" cy="13" r="8" />
      <Path key="1" d="M12 9v4l2 2" />
      <Path key="2" d="M5 3 2 6" />
      <Path key="3" d="m22 6-3-3" />
      <Path key="4" d="M6.38 18.7 4 21" />
      <Path key="5" d="M17.64 18.67 20 21" />
    </>
),
  'ban': (<>
      <Circle key="0" cx="12" cy="12" r="10" />
      <Path key="1" d="M4.929 4.929 19.07 19.071" />
    </>
),
  'calendar-check': (<>
      <Path key="0" d="M8 2v3" />
      <Path key="1" d="M16 2v3" />
      <Rect key="2" x="3" y="3" width="18" height="18" rx="2" />
      <Path key="3" d="M3 9h18" />
      <Path key="4" d="m9 15 2 2 4-4" />
    </>
),
  'calendar-days': (<>
      <Path key="0" d="M8 2v3" />
      <Path key="1" d="M16 2v3" />
      <Rect key="2" x="3" y="3" width="18" height="18" rx="2" />
      <Path key="3" d="M3 9h18" />
      <Path key="4" d="M8 13h.01" />
      <Path key="5" d="M12 13h.01" />
      <Path key="6" d="M16 13h.01" />
      <Path key="7" d="M8 17h.01" />
      <Path key="8" d="M12 17h.01" />
      <Path key="9" d="M16 17h.01" />
    </>
),
  'camera': (<>
      <Path key="0" d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
      <Circle key="1" cx="12" cy="13" r="3" />
    </>
),
  'carrot': (<>
      <Path key="0" d="M15 16a1 1 0 0 0-7-7q-4 4-5.987 12.385a.5.5 0 0 0 .602.602Q11 20 15 16l-3-3" />
      <Path key="1" d="M15 9q4 4 7 0-3-4-7 0 4-4 0-7-4 3 0 7" />
      <Path key="2" d="m8 15-2.58-2.58" />
    </>
),
  'check-check': (<>
      <Path key="0" d="M18 6 7 17l-5-5" />
      <Path key="1" d="m22 10-7.5 7.5L13 16" />
    </>
),
  'clock': (<>
      <Circle key="0" cx="12" cy="12" r="10" />
      <Path key="1" d="M12 6v6l4 2" />
    </>
),
  'cookie': (<>
      <Path key="0" d="M11 17h.01" />
      <Path key="1" d="M11.496 2c.324-.016.558.292.529.615a4 4 0 004.235 4.368.713.713 0 01.758.757 4 4 0 004.366 4.237c.323-.03.63.204.614.527a10 10 0 01-2.915 6.566A1 1 0 114.93 4.918 10 10 0 0111.496 2" />
      <Path key="2" d="M12 12h.01" />
      <Path key="3" d="M16 16h.01" />
      <Path key="4" d="M16 3h.01" />
      <Path key="5" d="M21 4h.01" />
      <Path key="6" d="M21 8h.01" />
      <Path key="7" d="M7 14h.01" />
      <Path key="8" d="M9 8h.01" />
    </>
),
  'droplets': (<>
      <Path key="0" d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
      <Path key="1" d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
    </>
),
  'fish': (<>
      <Path key="0" d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" />
      <Path key="1" d="M18 12v.5" />
      <Path key="2" d="M16 17.93a9.77 9.77 0 0 1 0-11.86" />
      <Path key="3" d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" />
      <Path key="4" d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" />
      <Path key="5" d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" />
    </>
),
  'glass-water': (<>
      <Path key="0" d="M5.116 4.104A1 1 0 0 1 6.11 3h11.78a1 1 0 0 1 .994 1.105L17.19 20.21A2 2 0 0 1 15.2 22H8.8a2 2 0 0 1-2-1.79z" />
      <Path key="1" d="M6 12a5 5 0 0 1 6 0 5 5 0 0 0 6 0" />
    </>
),
  'hand-heart': (<>
      <Path key="0" d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <Path key="1" d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95" />
      <Path key="2" d="m2 15 6 6" />
      <Path key="3" d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" />
    </>
),
  'milk': (<>
      <Path key="0" d="M8 2h8" />
      <Path key="1" d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" />
      <Path key="2" d="M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
    </>
),
  'nut': (<>
      <Path key="0" d="M12 4V2" />
      <Path key="1" d="M5 10v4a7.004 7.004 0 0 0 5.277 6.787c.412.104.802.292 1.102.592L12 22l.621-.621c.3-.3.69-.488 1.102-.592A7.003 7.003 0 0 0 19 14v-4" />
      <Path key="2" d="M12 4C8 4 4.5 6 4 8c-.243.97-.919 1.952-2 3 1.31-.082 1.972-.29 3-1 .54.92.982 1.356 2 2 1.452-.647 1.954-1.098 2.5-2 .595.995 1.151 1.427 2.5 2 1.31-.621 1.862-1.058 2.5-2 .629.977 1.162 1.423 2.5 2 1.209-.548 1.68-.967 2-2 1.032.916 1.683 1.157 3 1-1.297-1.036-1.758-2.03-2-3-.5-2-4-4-8-4Z" />
    </>
),
  'phone-call': (<>
      <Path key="0" d="M13 2a9 9 0 0 1 9 9" />
      <Path key="1" d="M13 6a5 5 0 0 1 5 5" />
      <Path key="2" d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </>
),
  'scan-line': (<>
      <Path key="0" d="M3 7V5a2 2 0 0 1 2-2h2" />
      <Path key="1" d="M17 3h2a2 2 0 0 1 2 2v2" />
      <Path key="2" d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <Path key="3" d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <Path key="4" d="M7 12h10" />
    </>
),
  'sparkles': (<>
      <Path key="0" d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <Path key="1" d="M20 2v4" />
      <Path key="2" d="M22 4h-4" />
      <Circle key="3" cx="4" cy="20" r="2" />
    </>
),
  'toilet': (<>
      <Path key="0" d="M7 12h13a1 1 0 0 1 1 1 5 5 0 0 1-5 5h-.598a.5.5 0 0 0-.424.765l1.544 2.47a.5.5 0 0 1-.424.765H5.402a.5.5 0 0 1-.424-.765L7 18" />
      <Path key="1" d="M8 18a5 5 0 0 1-5-5V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" />
    </>
),
  'utensils-crossed': (<>
      <Path key="0" d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <Path key="1" d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
      <Path key="2" d="m2.1 21.8 6.4-6.3" />
      <Path key="3" d="m19 5-7 7" />
    </>
),
  'wheat': (<>
      <Path key="0" d="M2 22 16 8" />
      <Path key="1" d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <Path key="2" d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <Path key="3" d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <Path key="4" d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
      <Path key="5" d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
      <Path key="6" d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
      <Path key="7" d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
    </>
),
  'x': (<>
      <Path key="0" d="M18 6 6 18" />
      <Path key="1" d="m6 6 12 12" />
    </>
),
};
