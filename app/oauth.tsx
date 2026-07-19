import { Redirect, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { completeOAuthLogin, toAuthErrorMessage } from '@/services/auth';
import { useQuizStore } from '@/store';

/**
 * Fallback deep-link target for the OAuth redirect. Normally the in-app
 * browser intercepts the redirect, but on Android a cold start can route the
 * link here instead; in that case we finish the session exchange ourselves.
 */
export default function OAuthCallbackScreen() {
  const { userId, secret } = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const setUser = useQuizStore((s) => s.setUser);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (userId && secret) {
        try {
          const user = await completeOAuthLogin(userId, secret);
          if (!cancelled) setUser(user);
        } catch (error) {
          Toast.show({ type: 'error', text1: 'Sign-in failed', text2: toAuthErrorMessage(error) });
        }
      }
      if (!cancelled) setDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, secret, setUser]);

  if (!done) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">Finishing sign-in…</Text>
      </View>
    );
  }

  return <Redirect href="/" />;
}
