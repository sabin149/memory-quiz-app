import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { TextField } from '@/components/ui/TextField';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { ThemePreference, useQuizStore } from '@/store';
import { isValidIntervalDays, TIME_PATTERN } from '@/utils/validation';

const THEME_OPTIONS: {
  value: ThemePreference;
  labelKey: string;
  icon: 'phone-portrait-outline' | 'sunny-outline' | 'moon-outline';
}[] = [
  { value: 'system', labelKey: 'settings.system', icon: 'phone-portrait-outline' },
  { value: 'light', labelKey: 'settings.light', icon: 'sunny-outline' },
  { value: 'dark', labelKey: 'settings.dark', icon: 'moon-outline' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings, theme, setTheme, language, setLanguage } = useQuizStore();
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
    Toast.show({ type: 'success', text1: t('common.save'), text2: t('settings.saved') });
    router.back();
  };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-4 sm:px-6"
    >
      <Card className="mb-4">
        <Text className="mb-3 font-semibold text-black dark:text-dark-text">
          {t('settings.appearance')}
        </Text>
        <View className="flex-row gap-3">
          {THEME_OPTIONS.map(({ value, labelKey, icon }) => {
            const label = t(labelKey);
            const selected = theme === value;
            return (
              <Pressable
                key={value}
                className={`flex-1 items-center rounded-xl border-2 p-3 ${
                  selected
                    ? 'border-primary bg-primary/5 dark:bg-primary/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
                onPress={() => setTheme(value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${label} theme`}
              >
                {/* Mini preview swatch */}
                <View
                  className={`mb-2 h-10 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${
                    value === 'dark' ? 'bg-gray-900' : value === 'light' ? 'bg-gray-100' : ''
                  }`}
                >
                  {value === 'system' ? (
                    <View className="flex-1 flex-row">
                      <View className="flex-1 bg-gray-100" />
                      <View className="flex-1 bg-gray-900" />
                    </View>
                  ) : (
                    <View className="m-2 h-1.5 w-2/3 rounded-full bg-primary/60" />
                  )}
                </View>
                <View className="flex-row items-center">
                  <Ionicons name={icon} size={14} color={selected ? '#4B5EAA' : '#9CA3AF'} />
                  <Text
                    className={`ml-1 text-sm ${
                      selected
                        ? 'font-semibold text-primary dark:text-dark-text'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {label}
                  </Text>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#4B5EAA"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 font-semibold text-black dark:text-dark-text">
          {t('settings.language')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SUPPORTED_LANGUAGES.map(({ value, label }) => (
            <Pressable
              key={value}
              className={`rounded-full border px-4 py-2 ${
                language === value
                  ? 'border-primary bg-primary'
                  : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
              }`}
              onPress={() => setLanguage(value)}
              accessibilityRole="button"
              accessibilityState={{ selected: language === value }}
            >
              <Text
                className={
                  language === value ? 'font-semibold text-white' : 'text-black dark:text-dark-text'
                }
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 font-semibold text-black dark:text-dark-text">
          {t('settings.reminders')}
        </Text>
        <TextField
          label={t('settings.intervalLabel')}
          placeholder="e.g. 2"
          value={quizInterval}
          onChangeText={setQuizInterval}
          error={intervalError}
          keyboardType="number-pad"
        />
        <TextField
          label={t('settings.timeLabel')}
          placeholder="HH:MM, e.g. 08:00"
          value={quizTime}
          onChangeText={setQuizTime}
          error={timeError}
        />
        <Button title={t('common.save')} icon="save-outline" onPress={handleSave} />
      </Card>
    </ScrollView>
  );
}
