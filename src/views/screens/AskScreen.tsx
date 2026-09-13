import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAskController } from '@/controllers/useAskController';
import type { ChatMessage } from '@/models/chat/chat.types';
import { BrandMark, Overline, Text } from '@/views/components/ui';
import { colors, MIN_TOUCH, radius, spacing } from '@/theme';

/**
 * The 24/7 chatbot (feature 05).
 *
 * Of everything CW12 proposed, this was the feature nursing staff welcomed
 * most, and the reason is in the hours: the preparation happens between six in
 * the evening and two in the morning, and no public hospital can be called back
 * in that window.
 *
 * ── SCAFFOLD ───────────────────────────────────────────────────────────────
 * `send` echoes a canned reply. The real one posts to the endpoint in
 * `EXPO_PUBLIC_API_URL` with the patient's profile and plan as context, and
 * streams the answer back.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Three things the real implementation must keep, all of them from the
 * interviews rather than from chatbot convention:
 *
 * 1. **Every answer carries the escalation.** The gastroenterologist's
 *    condition for letting a model answer patients at all was that they know
 *    these are suggestions and know how to reach a person. The route out is
 *    part of the answer, not a setting.
 * 2. **It must be able to say it does not know.** An answer invented at 1am is
 *    worse than "call this number", and the failure mode of a helpful assistant
 *    is that it never chooses the second.
 * 3. **It must refuse to authorise more purgative**, in every language, however
 *    the question is phrased. See `NEVER` in `features/flag/rules`.
 */

/**
 * The openers.
 *
 * These are the questions patients actually asked in the CW12 interviews, in
 * their own framing, not a tidy FAQ. An empty chat box at 1am is its own kind
 * of barrier.
 */
const SUGGESTIONS = [
  'Can I still drink kopi?',
  'I vomited some of the prep. What now?',
  'How do I know it is working?',
  'I am still passing solid stool at 1am',
];

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const { messages, send, isThinking, error } = useAskController();

  // Follow the thread as it grows, including when the reply lands.
  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length, isThinking]);

  function submit(text: string) {
    if (!text.trim()) return;
    send(text);
    setDraft('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom + 56}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={[styles.threadContent, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <BrandMark />

        <View style={styles.head}>
          <Overline>Any hour</Overline>
          <Text variant="display">Ask</Text>
          <Text variant="callout" tone="muted">
            Answers come from your own plan. They are suggestions, not instructions from your
            doctor.
          </Text>
        </View>

        {messages.length === 0 ? (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => submit(suggestion)}
                style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text variant="callout" tone="primary">
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : (
          messages.map((message) => <Bubble key={message.id} message={message} />)
        )}

        {isThinking ? (
          <View style={[styles.bubble, styles.theirs]}>
            <Text variant="body" tone="muted">
              Thinking…
            </Text>
          </View>
        ) : null}

        {/* Surfaced rather than dressed up as a reply: an error in the same
            bubble style as an answer teaches patients to trust the bubbles. */}
        {error ? (
          <View style={styles.failure}>
            <Text variant="callout" tone="alert">
              That did not send. Check your connection, or call the department.
            </Text>
          </View>
        ) : null}

        {/* Present on the screen from the first frame, not appended after an
            answer: the route to a person is not a fallback for when the model
            fails. */}
        <Pressable
          onPress={() => router.push('/safety')}
          style={({ pressed }) => [styles.escalate, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <Ionicons name="call-outline" size={18} color={colors.alert} />
          <Text variant="caption" tone="alert">
            Speak to a person instead
          </Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type your question"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
          maxFontSizeMultiplier={1.6}
          onSubmitEditing={() => submit(draft)}
          accessibilityLabel="Your question"
        />
        <Pressable
          onPress={() => submit(draft)}
          disabled={!draft.trim() || isThinking}
          style={({ pressed }) => [
            styles.sendButton,
            (!draft.trim() || isThinking) && styles.sendDisabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Ionicons name="arrow-up" size={20} color={colors.textOnAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'patient';

  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text variant="body" tone={mine ? 'onAccent' : 'default'}>
        {message.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  thread: { flex: 1 },
  threadContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  head: { gap: spacing.xs, marginBottom: spacing.sm },

  suggestions: { gap: spacing.sm },
  chip: {
    minHeight: MIN_TOUCH,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },

  bubble: {
    maxWidth: '86%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },

  failure: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.alertSoft,
  },
  escalate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: MIN_TOUCH,
    marginTop: spacing.sm,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  input: {
    flex: 1,
    minHeight: MIN_TOUCH,
    maxHeight: 140,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.cardSunken,
    color: colors.text,
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 23,
  },
  sendButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
