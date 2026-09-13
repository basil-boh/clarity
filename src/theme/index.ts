import type { TextStyle } from 'react-native';

/**
 * Design tokens.
 *
 * Two decisions here are clinical rather than aesthetic, and everything else
 * follows from them.
 *
 * **One typeface, set large.** Catholic+ split a serif for reading against a
 * sans for using, which is right for an app you browse. This is not that app.
 * The median user is over 50, preparing alone at home, and a good deal of the
 * reading happens at one in the morning on the fourth trip to the bathroom.
 * Inter throughout, with body at 17pt rather than the 15 a dashboard would
 * use, because every point of size here is worth more than any amount of
 * personality.
 *
 * **Green, amber and red are spoken for.** Feature 09 puts a single
 * green/amber/red flag in front of the nurse on the morning of the procedure,
 * built out of four compliance signals. If those three colours are also the
 * app's general-purpose success/warning/error palette, the flag stops being a
 * signal and becomes decoration. So they live under `flag` and are used *only*
 * for prep readiness. Ordinary interface states borrow from `ink` and
 * `primary`, and the one genuinely alarming state (a safety stop) gets
 * `alert`, which is a distinct plum rather than a fourth shade of red.
 */

export const palette = {
  // Grounds. Cool white paper, the deck's own ground.
  paper: '#FFFFFF',
  paperDim: '#F5F6FA',
  paperSunken: '#EDEFF6',

  // Ink. Blue-black, never pure.
  ink: '#0D0F14',
  inkMuted: '#4C5262',
  // Carries caption and overline sizes, so it is set by contrast, not taste:
  // 4.6:1 on `paperSunken`, which is the worst ground it lands on.
  inkFaint: '#6B7182',
  hairline: '#E3E6EE',
  hairlineStrong: '#CBD0DE',

  // The one bright blue, carried over from the CW12 deck so the app and the
  // pitch read as the same object.
  blue: '#2B4BF2',
  blueDeep: '#1E36BE',
  blueWash: '#EEF1FF',

  // Flag colours. Reserved for prep readiness. See the note above.
  //
  // Each pair is a *text* tone and a *fill* tint. The text tones are darkened
  // well past the pure hue because they are read at badge size on their own
  // tint: raw #0C9E63 measures 2.6:1 there, and #EFA100 barely 2.0.
  green: '#0A7A4E',
  greenTint: '#DDF1E7',
  amber: '#8A5A08',
  amberTint: '#FAEBD3',
  red: '#B92B1E',
  redTint: '#FBE3E0',

  // A safety stop: "do not take another dose", "call the department now".
  // Deliberately not red, so it cannot be mistaken for a red flag.
  alert: '#7A2A6B',
  alertTint: '#F6E6F3',

  // Night. The purge window is 6pm to 2am and the app is read in a dark
  // bathroom. The prep-night screen swaps to these; nothing else does.
  night: '#10131C',
  nightRaised: '#1B2030',
  nightInk: '#EDEFF6',
  nightInkMuted: '#A2A9BC',
  nightHairline: '#2C3346',
} as const;

export const colors = {
  background: palette.paperDim,
  card: palette.paper,
  cardSunken: palette.paperSunken,
  border: palette.hairline,
  borderStrong: palette.hairlineStrong,

  text: palette.ink,
  textMuted: palette.inkMuted,
  textFaint: palette.inkFaint,
  textOnAccent: '#FFFFFF',

  primary: palette.blue,
  primaryDeep: palette.blueDeep,
  primarySoft: palette.blueWash,

  alert: palette.alert,
  alertSoft: palette.alertTint,
} as const;

/** The three flag states, and nothing else, wear these. */
export const flag = {
  green: { ink: palette.green, tint: palette.greenTint },
  amber: { ink: palette.amber, tint: palette.amberTint },
  red: { ink: palette.red, tint: palette.redTint },
} as const;

export type FlagColour = keyof typeof flag;

/**
 * Categorical tints, for the diet food groups.
 *
 * These distinguish; they do not rank. That is the whole reason they exist as a
 * separate export rather than being folded into `colors`: a reader must never
 * infer that "produce" is better than "grains" because one is greener.
 *
 * Deliberately clear of the flag's green/amber/red. The produce tone is a blue
 * teal rather than the obvious green, and the protein tone a clay brown rather
 * than the obvious red, precisely so that a food group can never be misread as
 * a prep-readiness signal.
 */
export const categorical = {
  grains: { ink: '#3B4A8C', tint: '#E8EBF9' },
  protein: { ink: '#8E5438', tint: '#F7EAE2' },
  produce: { ink: '#2E6E7E', tint: '#E0EFF3' },
  fluids: { ink: '#5B57B0', tint: '#EAE8FA' },
} as const;

export type CategoricalKey = keyof typeof categorical;

/**
 * A tone per prep signal.
 *
 * The four measures behind the flag (diet, timing, fluids, output) were
 * previously four identical blue bars in a row, which made them read as one
 * four-part quantity rather than four separate things that can each be fine or
 * not. A tone each lets a reader find "timing" without reading the labels.
 *
 * Categorical, not ranked, and (like `categorical` above) kept clear of the
 * flag's green/amber/red so a *signal* can never be mistaken for a *verdict*.
 * Timing and output carry the two heaviest weights in `computeFlag`, so they
 * get the two strongest tones.
 */
export const signalTones = {
  dietCompliance: { ink: '#3B4A8C', tint: '#E8EBF9' },
  prepTiming: { ink: '#6247B5', tint: '#EDE9FA' },
  fluidIntake: { ink: '#2E7E8E', tint: '#E0F0F3' },
  bowelOutput: { ink: '#8E5438', tint: '#F7EAE2' },
} as const;

/**
 * The phases of the run-up, as colour.
 *
 * An earlier pass used a single-hue ramp that deepened toward the procedure.
 * It was elegant and it did not work: four shades of blue at swatch size are
 * four shades of blue, and a patient could not tell the diet days from the week
 * before without reading the numbers. Distinguishing is the job; the gradient
 * was a nicety on top of it, and the nicety lost.
 *
 * So: four separate hues, ordered cyan → violet → indigo → blue, each far
 * enough from the next to survive a small square on a calendar grid.
 *
 * All four are cool, and that is a constraint rather than a preference. Green,
 * amber and red belong to the prep flag, and warm hues sit close enough to
 * amber that a *date* could be misread as a *warning*. Cyan, violet and indigo
 * are the widest separation available inside that rule.
 *
 * Two of the five are quotations. `purge_night` is near the navy the prep-night
 * screen paints itself, so the square on the calendar and the screen it stands
 * for are recognisably the same thing; `procedure_day` is the app's primary
 * blue, because it is the destination.
 *
 * Keyed by string rather than by the `Phase` type from `models/`, so the theme
 * stays free of domain imports. Completeness is enforced where it is consumed,
 * with `satisfies Record<Phase, PhaseTone>`.
 */
export const phaseRamp = {
  waiting: { surface: '#EDF0F5', ink: '#6B7182', onDark: false, label: 'Waiting' },
  week_before: { surface: '#C7EDF5', ink: '#0B6379', onDark: false, label: 'Week before' },
  diet_day: { surface: '#DCCFFA', ink: '#5B21B6', onDark: false, label: 'Low-residue diet' },
  purge_night: { surface: '#312E81', ink: '#FFFFFF', onDark: true, label: 'Purge night' },
  procedure_day: { surface: '#2B4BF2', ink: '#FFFFFF', onDark: true, label: 'Procedure' },
  done: { surface: '#FFFFFF', ink: '#8B91A1', onDark: false, label: 'After' },
} as const;

export type PhaseTone = { surface: string; ink: string; onDark: boolean; label: string };

/** The prep-night surface. Same structure as `colors`, swapped for the dark. */
export const night = {
  background: palette.night,
  card: palette.nightRaised,
  border: palette.nightHairline,
  text: palette.nightInk,
  textMuted: palette.nightInkMuted,
  textFaint: palette.nightInkMuted,
  primary: '#8FA4FF',
} as const;

/** 4pt base scale. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 56,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 999,
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  /**
   * Outfit Light, and the only place in the app that is not Inter.
   *
   * It earns the exception by being geometric: the same construction as the
   * mark it sits under, circles and straight lines with even weight, where
   * Inter is a working interface face with none of that character. It is used
   * for exactly one string, the line under the logotype on the title page, and
   * should stay that way. A second typeface loose in a clinical app is how you
   * end up with two of everything.
   */
  slogan: 'Outfit_300Light',
} as const;

/**
 * Type scale.
 *
 * Larger throughout than a consumer app would set, for the reason given at the
 * top of the file. `clock` and `volume` are separate variants rather than a
 * style prop because a mistimed dose or a half-finished bottle is the failure
 * this app exists to prevent: those two numbers are the most important glyphs
 * on the screen, and tabular figures stop a live countdown from jittering as
 * it ticks.
 */
export const type = {
  display: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.5 },
  title: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.semi, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.semi, fontSize: 17, lineHeight: 23, letterSpacing: -0.2 },

  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 25 },
  bodyStrong: { fontFamily: fonts.semi, fontSize: 17, lineHeight: 25 },
  callout: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 13.5, lineHeight: 18 },
  overline: { fontFamily: fonts.semi, fontSize: 11.5, lineHeight: 15, letterSpacing: 0.7 },

  /**
   * The line under the logotype, and nothing else.
   *
   * Sized to hold on one line at 320pt, the narrowest phone the app supports:
   * two lines under a wordmark reads as a paragraph rather than a strapline.
   * Light weight and generous tracking because it sits directly beneath a very
   * heavy mark and has to recede from it.
   */
  slogan: {
    fontFamily: fonts.slogan,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: 0.2,
  },

  clock: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  volume: {
    fontFamily: fonts.semi,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
} as const satisfies Record<string, TextStyle>;

/** Elevation. Three steps, so a surface is never ambiguous about its layer. */
export const shadow = {
  none: {},
  card: {
    shadowColor: '#0D0F14',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  raised: {
    shadowColor: '#0D0F14',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

/** Motion. One duration set, so the whole app moves with one rhythm. */
export const motion = { fast: 140, base: 220, slow: 320 } as const;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
/** 48 rather than 44: the hands using this app are older than average. */
export const MIN_TOUCH = 48;

export const theme = {
  colors,
  palette,
  flag,
  categorical,
  signalTones,
  phaseRamp,
  night,
  spacing,
  radius,
  type,
  shadow,
  motion,
} as const;
export type Theme = typeof theme;
