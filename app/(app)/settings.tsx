import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useQuizStore } from '@/store';
import { isValidIntervalDays, TIME_PATTERN } from '@/utils/validation';

export default function SettingsScreen() {
  const { settings, updateSettings, user } = useQuizStore();
  const router = useRouter();

  const [quizInterval, setQuizInterval] = useState(String(settings.quizIntervalDays));
  const [quizTime, setQuizTime] = useState(settings.quizTime);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSave = () => {
    if (!isValidIntervalDays(quizInterval)) {
      setErrorText('Quiz interval must be a whole number between 1 and 365 days.');
      return;
    }
    if (!TIME_PATTERN.test(quizTime)) {
      setErrorText('Quiz time must be in 24h HH:MM format, e.g. 08:00.');
      return;
    }
    setErrorText(null);
    updateSettings({ quizIntervalDays: Number(quizInterval), quizTime });
    Toast.show({ type: 'success', text1: 'Saved', text2: 'Settings updated.' });
    router.back();
  };

  return (
    <View className="flex-1 bg-background px-4 py-8 dark:bg-dark-bg sm:px-6">
      <Text className="mb-1 text-black dark:text-dark-text">Signed in as</Text>
      <Text className="mb-6 font-semibold text-black dark:text-dark-text">{user?.email}</Text>

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
      <Pressable onPress={() => router.back()}>
        <Text className="text-center text-secondary dark:text-accent">Back</Text>
      </Pressable>
    </View>
  );
}
