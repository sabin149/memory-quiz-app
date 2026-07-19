import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Card from '@/components/ui/Card';
import {
  deactivateAccount,
  logout,
  sendVerificationEmail,
  toAuthErrorMessage,
} from '@/services/auth';
import { useQuizStore } from '@/store';
import { computeStreak, levelFromXp } from '@/utils/gamification';

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const content = (
    <View className="flex-row items-center py-3">
      <Ionicons name={icon} size={20} color={danger ? '#EF4444' : '#4B5EAA'} />
      <Text
        className={`ml-3 flex-1 ${danger ? 'font-semibold text-red-500' : 'text-black dark:text-dark-text'}`}
      >
        {label}
      </Text>
      {value && <Text className="mr-1 text-sm text-gray-500 dark:text-gray-400">{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export default function ProfileScreen() {
  const { user, isAdmin, gamification, conversations, clearUserData } = useQuizStore();
  const router = useRouter();
  const [sendingVerification, setSendingVerification] = useState(false);

  const streak = computeStreak(gamification.activity);
  const level = levelFromXp(gamification.totalXp);

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await sendVerificationEmail();
      Toast.show({
        type: 'success',
        text1: 'Verification sent',
        text2: 'Check your inbox and open the link on this device.',
      });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not send', text2: toAuthErrorMessage(error) });
    } finally {
      setSendingVerification(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Session may already be invalid server-side; clear local state regardless.
    }
    clearUserData();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'Your account will be deactivated and you will be logged out. You will no longer be able to log in. This cannot be undone from the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateAccount();
              clearUserData();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Deletion failed',
                text2: toAuthErrorMessage(error),
              });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-4 sm:px-6"
    >
      <Card className="mb-4 items-center py-6">
        <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Text className="text-2xl font-bold text-primary">
            {(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text className="text-lg font-semibold text-black dark:text-dark-text">{user?.name}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</Text>
        {user?.emailVerification ? (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
            <Text className="ml-1 text-xs text-green-600">Verified</Text>
          </View>
        ) : (
          <Pressable className="mt-2" onPress={handleSendVerification} accessibilityRole="button">
            <Text className="text-xs text-secondary dark:text-accent">
              {sendingVerification ? 'Sending…' : 'Email not verified — send link'}
            </Text>
          </Pressable>
        )}
        <View className="mt-4 flex-row">
          <View className="mx-4 items-center">
            <Text className="text-lg font-bold text-black dark:text-dark-text">{streak}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Streak</Text>
          </View>
          <View className="mx-4 items-center">
            <Text className="text-lg font-bold text-black dark:text-dark-text">{level.level}</Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Level</Text>
          </View>
          <View className="mx-4 items-center">
            <Text className="text-lg font-bold text-black dark:text-dark-text">
              {conversations.length}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">Saved</Text>
          </View>
        </View>
      </Card>

      <Card className="mb-4">
        <Row
          icon="notifications-outline"
          label="Quiz reminders & appearance"
          onPress={() => router.push('/settings')}
        />
        <View className="h-px bg-gray-200 dark:bg-gray-700" />
        <Row icon="trending-up-outline" label="Progress & achievements" onPress={() => router.push('/stats')} />
        <View className="h-px bg-gray-200 dark:bg-gray-700" />
        <Row
          icon="document-lock-outline"
          label="Privacy policy"
          onPress={() => router.push('/privacy')}
        />
        {isAdmin && (
          <>
            <View className="h-px bg-gray-200 dark:bg-gray-700" />
            <Row icon="shield-outline" label="Admin portal" onPress={() => router.push('/admin')} />
          </>
        )}
      </Card>

      <Card>
        <Row icon="log-out-outline" label="Log out" onPress={handleLogout} />
        <View className="h-px bg-gray-200 dark:bg-gray-700" />
        <Row icon="trash-outline" label="Delete account" onPress={handleDeleteAccount} danger />
      </Card>
    </ScrollView>
  );
}
