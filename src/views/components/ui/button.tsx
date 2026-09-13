import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { MIN_TOUCH, colors, radius, spacing } from '@/theme';

import { usePressFeedback } from './motion';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'alert';
type Size = 'md' | 'lg';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const surfaces: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  ghost: { backgroundColor: 'transparent' },
  alert: { backgroundColor: colors.alertSoft },
};

const labelTones: Record<Variant, 'onAccent' | 'primary' | 'alert'> = {
  primary: 'onAccent',
  secondary: 'primary',
  ghost: 'primary',
  alert: 'alert',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const isInert = disabled || loading;
  const tone = labelTones[variant];
  const tint = tone === 'onAccent' ? colors.textOnAccent : colors[tone];
  // Shallower than a card's dip: a button is smaller, so the same ratio reads
  // as the control flinching.
  const { press, pressStyle } = usePressFeedback(0.96);

  function handlePress() {
    if (isInert) return;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => {
        press.value = 1;
      }}
      onPressOut={() => {
        press.value = 0;
      }}
      disabled={isInert}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInert, busy: loading }}
      accessibilityLabel={label}
      style={fullWidth ? styles.fullWidth : undefined}
    >
      <Animated.View
        style={[
          styles.base,
          surfaces[variant],
          size === 'lg' && styles.large,
          fullWidth && styles.fullWidth,
          isInert && styles.inert,
          style,
          // Skipped while inert, so a disabled button does not appear to
          // respond to a press it is going to ignore.
          isInert ? undefined : pressStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={tint} />
        ) : (
          <View style={styles.content}>
            {icon ? <Ionicons name={icon} size={20} color={tint} /> : null}
            <Text variant="bodyStrong" tone={tone}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { minHeight: 56, paddingHorizontal: spacing['2xl'] },
  fullWidth: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inert: { opacity: 0.45 },
});
