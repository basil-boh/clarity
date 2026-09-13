import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, type as typeScale } from '@/theme';

type Variant = keyof typeof typeScale;
type Tone = 'default' | 'muted' | 'faint' | 'primary' | 'alert' | 'onAccent' | 'inherit';

const toneColor: Record<Exclude<Tone, 'inherit'>, string> = {
  default: colors.text,
  muted: colors.textMuted,
  faint: colors.textFaint,
  primary: colors.primary,
  alert: colors.alert,
  onAccent: colors.textOnAccent,
};

export type TextProps = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
  center?: boolean;
};

/**
 * Every piece of text goes through here, so the type scale stays a closed set.
 *
 * Weight comes from `fontFamily`, never `fontWeight`: with a custom typeface a
 * numeric weight silently falls back to a synthesised bold on Android.
 *
 * `tone="inherit"` sets no colour at all, for the two dark surfaces (the
 * prep-night screen and the carousel's photo scrim) where the palette above
 * would be unreadable and the caller supplies its own via `style`.
 */
export function Text({ variant = 'body', tone = 'default', center, style, ...rest }: TextProps) {
  return (<RNText
      // Capped so a 200% system size cannot break a card, while still honouring
      // Dynamic Type up to a usable ceiling. Higher than a typical app's 1.5,
      // because large text is exactly what this audience turns on.
      maxFontSizeMultiplier={1.8}
      style={[
        typeScale[variant] as TextStyle,
        tone !== 'inherit' && { color: toneColor[tone] },
        center && { textAlign: 'center' },
        style,
      ]}
      {...rest}
    />
);
}

export function Title(props: Omit<TextProps, 'variant'>) {
  return <Text variant="title" {...props} />;
}

export function Heading(props: Omit<TextProps, 'variant'>) {
  return <Text variant="heading" {...props} />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" tone="muted" {...props} />;
}

/** The small caps label that heads a section. */
export function Overline({ style, ...props }: Omit<TextProps, 'variant'>) {
  return (<Text variant="overline" tone="faint" style={[{ textTransform: 'uppercase' }, style]} {...props} />
);
}
