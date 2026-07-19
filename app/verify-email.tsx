import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { confirmVerification, getCurrentUser, toAuthErrorMessage } from '@/services/auth';
import { useQuizStore } from '@/store';

type Status = 'verifying' | 'success' | 'error';

/** Deep-link target of the verification email (userId + secret params). */
export default function VerifyEmailScreen() {
  const { userId, secret } = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const router = useRouter();
  const setUser = useQuizStore((s) => s.setUser);
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userId || !secret) {
        if (!cancelled) {
          setStatus('error');
          setMessage('This verification link is invalid or incomplete.');
        }
        return;
      }
      try {
        await confirmVerification(userId, secret);
        // Refresh the cached user so emailVerification reflects the change.
        const user = await getCurrentUser();
        if (!cancelled) {
          if (user) setUser(user);
          setStatus('success');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setMessage(toAuthErrorMessage(error));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, secret, setUser]);

  return (
    <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
      {status === 'verifying' ? (
        <>
          <ActivityIndicator />
          <Text className="mt-4 text-center text-gray-500 dark:text-gray-400">
            Verifying your email…
          </Text>
        </>
      ) : (
        <>
          <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
            {status === 'success' ? 'Email verified' : 'Verification failed'}
          </Text>
          <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
            {status === 'success' ? 'Your email address is confirmed. You are all set.' : message}
          </Text>
          <Pressable className="rounded-lg bg-primary p-3" onPress={() => router.replace('/')}>
            <Text className="text-center font-semibold text-white">Continue</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
