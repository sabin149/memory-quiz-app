import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { colorScheme } from 'nativewind';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/ToastCard';
import { applyLanguage } from '@/lib/i18n';
import { initCrashReporting } from '@/lib/sentry';
import { getCurrentUser } from '@/services/auth';
import { useQuizStore } from '@/store';
import './globals.css';

initCrashReporting();
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: true },
  },
});

export default function RootLayout() {
  const { authReady, setUser, setAuthReady } = useQuizStore();
  const theme = useQuizStore((s) => s.theme);
  // Icon fonts must be loaded explicitly for glyphs to render on web.
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
  });

  const language = useQuizStore((s) => s.language);

  // Re-applied when the persisted preferences finish rehydrating.
  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);
  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!cancelled) {
        setUser(user);
        setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser, setAuthReady]);

  useEffect(() => {
    if (authReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [authReady, fontsLoaded]);

  if (!authReady || !fontsLoaded) {
    return null; // splash screen stays visible until session + fonts are ready
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="privacy" options={{ headerShown: false }} />
        <Stack.Screen name="verify-pending" options={{ headerShown: false }} />
        <Stack.Screen name="oauth" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      </Stack>
      <Toast config={toastConfig} position="bottom" bottomOffset={70} />
    </QueryClientProvider>
  );
}
