import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { colors, motion, radius, spacing } from '@/theme';

import { Button } from './button';
import { Stagger } from './motion';
import { Text } from './text';

/**
 * The states every data-backed screen must handle. Having them shared is what
 * keeps "loading" from silently becoming "empty" when a query fails.
 *
 * They also cross-fade between one another. A spinner replaced by content in a
 * single frame reads as a glitch, because the eye registers the jump and not
 * the arrival. Since every data-backed screen passes through here, that one
 * transition does more for how finished the app feels than any per-screen
 * animation could.
 */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (<View style={styles.centered} accessibilityRole="progressbar">
      <ActivityIndicator color={colors.primary} />
      <Text variant="callout" tone="muted">
        {label}
      </Text>
    </View>
);
}

export function EmptyState({
  icon = 'ellipse-outline',
  title,
  description,
  action,
  onAction,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  const reduced = useReducedMotion();

  return (<View style={[styles.centered, styles.empty, style]}>
      <Animated.View
        style={styles.halo}
        entering={reduced ? undefined : ZoomIn.duration(motion.slow).springify()}
      >
        <Ionicons name={icon} size={28} color={colors.primary} />
      </Animated.View>
      <Text variant="subheading" center>
        {title}
      </Text>
      {description ? (<Text variant="callout" tone="muted" center style={styles.description}>
          {description}
        </Text>
) : null}
      {action && onAction ? <Button label={action} variant="secondary" onPress={onAction} /> : null}
    </View>
);
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const reduced = useReducedMotion();
  const message =
    error instanceof Error ? error.message : 'Something went wrong loading this page.';

  return (<View style={[styles.centered, styles.empty]}>
      <Animated.View
        style={[styles.halo, { backgroundColor: colors.alertSoft }]}
        entering={reduced ? undefined : ZoomIn.duration(motion.slow).springify()}
      >
        <Ionicons name="cloud-offline-outline" size={28} color={colors.alert} />
      </Animated.View>
      <Text variant="subheading" center>
        We could not load this
      </Text>
      <Text variant="callout" tone="muted" center style={styles.description}>
        {message}
      </Text>
      {/* Nothing in this app is safe to guess at, so an offline screen says so
          rather than showing a stale plan as though it were current. */}
      <Text variant="caption" tone="faint" center style={styles.description}>
        Your prep plan is not shown while it cannot be confirmed. If your procedure is today,
        follow the sheet you were given and call the department.
      </Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
);
}

/**
 * Renders the right state for a query, or the children once data has arrived.
 *
 * The single-block states fade in as one; loaded content is staggered instead,
 * block by block. That difference is structural, not stylistic: wrapping a list
 * of blocks in one animated view makes it a single flex child and collapses the
 * `gap` its parent column is spacing it with. `Stagger` wraps each child in
 * place, so the layout is untouched.
 *
 * Nothing animates out. An exiting view stays mounted while it fades, which in
 * a flex column means the outgoing state still takes up room while the new one
 * lands, so the page visibly shunts. A clean cut out and a fade in reads better
 * than a cross-fade that moves the content.
 *
 * There is deliberately no `isLoading` prop. `data === undefined` already
 * covers every state in which there is nothing to show (pending, disabled,
 * and the gap while a dependent query waits on its parent) and taking the flag
 * as well would let a caller pass a combination that contradicts itself.
 */
export function QueryBoundary<T>({
  error,
  data,
  onRetry,
  loadingLabel,
  empty,
  isEmpty,
  children,
}: {
  error: unknown;
  /** `undefined` means "not here yet", whether pending, disabled or idle. */
  data: T | undefined;
  onRetry?: () => void;
  loadingLabel?: string;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  const reduced = useReducedMotion();

  function settled(state: string, node: ReactNode) {
    return (<Animated.View key={state} entering={reduced ? undefined : FadeIn.duration(motion.base)}>
        {node}
      </Animated.View>
);
  }

  if (error && data === undefined) return settled('error', <ErrorState error={error} onRetry={onRetry} />);
  if (data === undefined) return settled('loading', <LoadingState label={loadingLabel} />);
  if (empty && isEmpty?.(data)) return settled('empty', empty);

  return <Stagger>{children(data)}</Stagger>;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  empty: { gap: spacing.lg },
  halo: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { maxWidth: 320 },
});
