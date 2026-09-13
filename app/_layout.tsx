import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Outfit_300Light } from '@expo-google-fonts/outfit';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useOnboarding } from '@/models/onboarding/onboarding.model';
import { createQueryClient } from '@/lib/query';
import { AppLogo } from '@/views/components/AppLogo';
import { colors, fonts } from '@/theme';

void SplashScreen.preventAutoHideAsync();

/**
 * Sends the user to the right part of the app.
 *
 * Redirecting from an effect rather than rendering `<Redirect>` avoids a frame
 * where the destination mounts and fires its queries before the gate has
 * decided.
 *
 * There is no auth gate here yet, and that is a deliberate ordering rather than
 * an omission: the tour has to come first regardless, because slide five states
 * the limits of the software and a patient deciding whether to trust it with a
 * photograph of their own stool should meet those before any account form.
 * Sign-in slots in after `needsOnboarding` when it exists.
 */
function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { isReady: onboardingReady, needsOnboarding } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const splashHidden = useRef(false);

  useEffect(() => {
    if (!fontsReady || !onboardingReady) return;

    if (!splashHidden.current) {
      splashHidden.current = true;
      void SplashScreen.hideAsync();
    }

    const inOnboarding = segments[0] === 'onboarding';

    if (needsOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (!needsOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [fontsReady, onboardingReady, needsOnboarding, segments, router]);

  // Holding the splash until the typefaces are ready avoids a visible reflow
  // from the system font to Inter on first paint. The onboarding flag is read
  // in the same breath, so the first frame is already the right screen rather
  // than a redirect away from the wrong one.
  if (!fontsReady || !onboardingReady) {
    // The hand-off from the native splash. It was a bare coloured rectangle,
    // which read as a stall on a cold start; carrying the same mark the splash
    // shows makes the two frames continuous instead.
    return (
      <View style={styles.loading}>
        <AppLogo size={88} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        // The platform's own header, so the back control is the real one: the
        // system chevron, the system font, the system press target, and the
        // interactive edge-swipe that comes with it. This replaced a custom
        // circular chevron inside `ScreenHeader`, which looked close but was
        // not the thing, and had to reimplement `canGoBack` by hand.
        headerShown: true,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: colors.primary,
        headerTitleStyle: { fontFamily: fonts.semi, fontSize: 17, color: colors.text },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {/* The two screens that own the whole display and have nowhere to go
          back to. */}
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />

      {/*
        Pushed, not presented as modals. A modal has no back button on either
        platform: iOS gives it a swipe-down and Android the system gesture, so
        asking for a native back control means asking for a pushed screen.
      */}
      <Stack.Screen name="check/meal" options={{ title: 'Meal check' }} />
      <Stack.Screen name="check/stool" options={{ title: 'Prep check' }} />
      <Stack.Screen name="safety" options={{ title: 'Getting help' }} />
      <Stack.Screen name="flag" options={{ title: 'Prep summary' }} />
      <Stack.Screen name="calendar" options={{ title: 'Your dates' }} />
    </Stack>
  );
}

export default function RootLayout() {
  // One client for the app's lifetime, created lazily so it is not rebuilt on
  // fast refresh.
  const [queryClient] = useState(createQueryClient);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_300Light,
  });

  // A font that fails to load should degrade to the system face, not block the
  // app forever behind a blank screen.
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Gate fontsReady={fontsReady} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
