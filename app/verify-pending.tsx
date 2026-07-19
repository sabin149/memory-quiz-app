import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import {
  getCurrentUser,
  logout,
  sendVerificationEmail,
  toAuthErrorMessage,
} from '@/services/auth';
import { useQuizStore } from '@/store';

/** Shown to logged-in users until they verify their email address. */
export default function VerifyPendingScreen() {
  const user = useQuizStore((s) => s.user);
  const setUser = useQuizStore((s) => s.setUser);
  const clearUserData = useQuizStore((s) => s.clearUserData);
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  if (!user) return <Redirect href="/login" />;
  if (user.emailVerification) return <Redirect href="/home" />;

  const handleResend = async () => {
    setSending(true);
    try {
      await sendVerificationEmail();
      Toast.show({
        type: 'success',
        text1: 'Verification sent',
        text2: `Check ${user.email} and open the link.`,
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not send', text2: toAuthErrorMessage(error) });
    } finally {
      setSending(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    const fresh = await getCurrentUser();
    setChecking(false);
    if (fresh?.emailVerification) {
      setUser(fresh);
      router.replace('/home');
    } else {
      Toast.show({
        type: 'info',
        text1: 'Not verified yet',
        text2: 'Open the link in your email first, then try again.',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Session may already be gone; clear local state regardless.
    }
    clearUserData();
  };

  return (
    <View className="flex-1 justify-center bg-background px-8 dark:bg-dark-bg">
      <Animated.View entering={FadeInDown.duration(400)}>
        <View className="mb-6 items-center">
          <Ionicons name="mail-unread-outline" size={64} color="#4B5EAA" />
        </View>
        <Text className="mb-2 text-center text-3xl font-bold text-primary dark:text-dark-text">
          Verify your email
        </Text>
        <Text className="mb-8 text-center text-gray-500 dark:text-gray-400">
          We sent a verification link to{' '}
          <Text className="font-semibold text-black dark:text-dark-text">{user.email}</Text>. Open
          it, then come back here.
        </Text>
        <Button
          title="I've verified — continue"
          icon="checkmark-circle-outline"
          onPress={handleCheck}
          loading={checking}
          className="mb-3"
        />
        <Button
          title="Resend email"
          icon="mail-outline"
          variant="secondary"
          onPress={handleResend}
          loading={sending}
          className="mb-3"
        />
        <Button title="Log out" variant="ghost" onPress={handleLogout} />
      </Animated.View>
    </View>
  );
}
