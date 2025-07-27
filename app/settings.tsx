import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useQuizStore } from '../store';

export default function SettingsScreen() {
  const { settings, updateSettings, user } = useQuizStore();
  const router = useRouter();

  const [quizInterval, setQuizInterval] = useState(settings.quizInterval);
  const [quizTime, setQuizTime] = useState(settings.quizTime);


  if (!user) {
    router.replace('/login');
    return null;
  }


  const handleSave = () => {
    updateSettings(quizInterval, quizTime);
    alert('Settings saved!');
  };

  return (
    <View className="flex-1 px-4 sm:px-6 py-10 bg-background dark:bg-dark-bg">
      <Text className="text-3xl font-bold text-center mb-6 text-primary dark:text-dark-text">Settings</Text>
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600"
        placeholder="Quiz Interval (days)"
        value={quizInterval}
        onChangeText={setQuizInterval}
        keyboardType="numeric"
      />
      <TextInput
        className="border border-gray-300 rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 dark:border-gray-600"
        placeholder="Preferred Quiz Time (HH:MM)"
        value={quizTime}
        onChangeText={setQuizTime}
      />
      <Pressable
        className="bg-primary rounded-lg p-3 mb-4"
        onPress={handleSave}
      >
        <Text className="text-white text-center font-semibold">Save</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/home')}>
        <Text className="text-secondary text-center dark:text-accent">Back to Home</Text>
      </Pressable>
    </View>
  );
}