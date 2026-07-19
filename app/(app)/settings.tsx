import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { ThemePreference, useQuizStore } from '@/store';
import { isValidIntervalDays, TIME_PATTERN } from '@/utils/validation';

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: 'phone-portrait-outline' | 'sunny-outline' | 'moon-outline';
}[] = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const { settings, updateSettings, theme, setTheme } = useQuizStore();
  const router = useRouter();

  const [quizInterval, setQuizInterval] = useState(String(settings.quizIntervalDays));
  const [quizTime, setQuizTime] = useState(settings.quizTime);
  const [intervalError, setIntervalError] = useState<string | undefined>();
  const [timeError, setTimeError] = useState<string | undefined>();

  const handleSave = async () => {
    const intervalOk = isValidIntervalDays(quizInterval);
    const timeOk = TIME_PATTERN.test(quizTime);
    setIntervalError(intervalOk ? undefined : 'Must be a whole number between 1 and 365 days.');
    setTimeError(timeOk ? undefined : 'Use 24h HH:MM format, e.g. 08:00.');
    if (!intervalOk || !timeOk) return;

    // Also reschedules the next quiz reminder notification.
    await updateSettings({ quizIntervalDays: Number(quizInterval), quizTime });
    Toast.show({ type: 'success', text1: 'Saved', text2: 'Preferences updated.' });
    router.back();
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-4 sm:px-6"
    >
      <Card className="mb-4">
        <Text className="mb-3 font-semibold text-black dark:text-dark-text">Appearance</Text>
        <View className="flex-row overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
          {THEME_OPTIONS.map(({ value, label, icon }) => (
            <Pressable
              key={value}
              className={`flex-1 flex-row items-center justify-center p-3 ${theme === value ? 'bg-primary' : 'bg-white dark:bg-gray-800'}`}
              onPress={() => setTheme(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: theme === value }}
            >
              <Ionicons
                name={icon}
                size={16}
                color={theme === value ? '#fff' : '#9CA3AF'}
                style={{ marginRight: 6 }}
              />
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
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 font-semibold text-black dark:text-dark-text">Quiz reminders</Text>
        <TextField
          label="Interval (days)"
          placeholder="e.g. 2"
          value={quizInterval}
          onChangeText={setQuizInterval}
          error={intervalError}
          keyboardType="number-pad"
        />
        <TextField
          label="Preferred time (24h)"
          placeholder="HH:MM, e.g. 08:00"
          value={quizTime}
          onChangeText={setQuizTime}
          error={timeError}
        />
        <Button title="Save" icon="save-outline" onPress={handleSave} />
      </Card>
    </ScrollView>
  );
}
