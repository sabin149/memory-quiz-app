import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  deactivateAccount,
  sendVerificationEmail,
  toAuthErrorMessage,
} from '@/services/auth';
import { ThemePreference, useQuizStore } from '@/store';
import { isValidIntervalDays, TIME_PATTERN } from '@/utils/validation';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { settings, updateSettings, user, clearUserData, theme, setTheme } = useQuizStore();
  const router = useRouter();

  const [quizInterval, setQuizInterval] = useState(String(settings.quizIntervalDays));
  const [quizTime, setQuizTime] = useState(settings.quizTime);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!isValidIntervalDays(quizInterval)) {
      setErrorText('Quiz interval must be a whole number between 1 and 365 days.');
      return;
    }
    if (!TIME_PATTERN.test(quizTime)) {
      setErrorText('Quiz time must be in 24h HH:MM format, e.g. 08:00.');
      return;
    }
    setErrorText(null);
    // Also reschedules the next quiz reminder notification.
    await updateSettings({ quizIntervalDays: Number(quizInterval), quizTime });
    Toast.show({ type: 'success', text1: 'Saved', text2: 'Settings updated.' });
    router.back();
  };

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
            setDeleting(true);
            try {
              await deactivateAccount();
              clearUserData();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Deletion failed',
                text2: toAuthErrorMessage(error),
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-8 sm:px-6"
    >
      <Text className="mb-1 text-black dark:text-dark-text">Signed in as</Text>
      <Text className="mb-1 font-semibold text-black dark:text-dark-text">{user?.email}</Text>
      {user?.emailVerification ? (
        <Text className="mb-6 text-green-600">Email verified</Text>
      ) : (
        <Pressable
          className="mb-6"
          onPress={handleSendVerification}
          disabled={sendingVerification}
        >
          <Text className="text-secondary dark:text-accent">
            {sendingVerification
              ? 'Sending verification email…'
              : 'Email not verified — send verification link'}
          </Text>
        </Pressable>
      )}

      <Text className="mb-1 text-black dark:text-dark-text">Appearance</Text>
      <View className="mb-4 flex-row overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
        {THEME_OPTIONS.map(({ value, label }) => (
          <Pressable
            key={value}
            className={`flex-1 p-3 ${theme === value ? 'bg-primary' : 'bg-white dark:bg-gray-800'}`}
            onPress={() => setTheme(value)}
          >
            <Text
              className={`text-center ${
                theme === value ? 'font-semibold text-white' : 'text-black dark:text-dark-text'
              }`}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-1 text-black dark:text-dark-text">Quiz interval (days)</Text>
      <TextInput
        className="mb-4 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        placeholder="e.g. 2"
        placeholderTextColor="#9CA3AF"
        value={quizInterval}
        onChangeText={setQuizInterval}
        keyboardType="number-pad"
      />
      <Text className="mb-1 text-black dark:text-dark-text">Preferred quiz time (24h)</Text>
      <TextInput
        className="mb-4 rounded-lg border border-gray-300 bg-white p-3 text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        placeholder="HH:MM, e.g. 08:00"
        placeholderTextColor="#9CA3AF"
        value={quizTime}
        onChangeText={setQuizTime}
      />
      {errorText && <Text className="mb-4 text-red-500">{errorText}</Text>}
      <Pressable className="mb-4 rounded-lg bg-primary p-3" onPress={handleSave}>
        <Text className="text-center font-semibold text-white">Save</Text>
      </Pressable>
      <Pressable className="mb-4" onPress={() => router.push('/privacy')}>
        <Text className="text-center text-secondary dark:text-accent">Privacy policy</Text>
      </Pressable>
      <Pressable className="mb-10" onPress={() => router.back()}>
        <Text className="text-center text-secondary dark:text-accent">Back</Text>
      </Pressable>

      <Text className="mb-2 font-semibold text-red-500">Danger zone</Text>
      <Pressable
        className={`rounded-lg border border-red-500 p-3 ${deleting ? 'opacity-60' : ''}`}
        onPress={handleDeleteAccount}
        disabled={deleting}
      >
        <Text className="text-center font-semibold text-red-500">
          {deleting ? 'Deleting account…' : 'Delete account'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
