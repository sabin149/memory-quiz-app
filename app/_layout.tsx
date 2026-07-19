import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { getCurrentUser } from '@/services/auth';
import { useQuizStore } from '@/store';
import './globals.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { authReady, setUser, setAuthReady } = useQuizStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!cancelled) {
        setUser(user);
        setAuthReady(true);
        SplashScreen.hideAsync();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser, setAuthReady]);

  if (!authReady) {
    return null; // splash screen stays visible until the session check finishes
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="oauth" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
      </Stack>
      <Toast position="bottom" bottomOffset={50} />
    </>
  );
}
