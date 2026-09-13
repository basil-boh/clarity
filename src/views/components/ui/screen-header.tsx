import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './text';

/**
 * A subtitle block under a native header.
 *
 * This used to draw its own back button, because the app hid the platform
 * header so each screen could scroll its own title. That trade is off: the
 * native header is back, and with it the real back control, so the only thing
 * left for this component to carry is the line of context a native header has
 * nowhere to put.
 *
 * Kept rather than deleted because that line is doing work on three screens.
 * "The photo is not saved" above a viewfinder is a promise, and it belongs
 * where the camera is, not in a title bar.
 */
export function ScreenHeader({
  subtitle,
  action,
}: {
  /** The screen's own title comes from the navigator; this is the line under it. */
  subtitle?: string;
  action?: ReactNode;
}) {
  if (!subtitle && !action) return null;

  return (
    <View style={styles.header}>
      {subtitle ? (
        <Text variant="callout" tone="muted" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  subtitle: { flex: 1 },
});
