import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import { useQuizStore } from '@/store';

const SLIDES = [
  {
    icon: (
      <MaterialCommunityIcons name="head-question-outline" size={72} color="#4B5EAA" />
    ),
    titleKey: 'onboarding.slide1Title',
    bodyKey: 'onboarding.slide1Body',
  },
  {
    icon: <Ionicons name="cloud-upload-outline" size={72} color="#4B5EAA" />,
    titleKey: 'onboarding.slide2Title',
    bodyKey: 'onboarding.slide2Body',
  },
  {
    icon: <Ionicons name="school-outline" size={72} color="#4B5EAA" />,
    titleKey: 'onboarding.slide3Title',
    bodyKey: 'onboarding.slide3Body',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setHasOnboarded = useQuizStore((s) => s.setHasOnboarded);
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    setHasOnboarded(true);
    router.replace('/register');
  };

  return (
    <View className="flex-1 justify-center bg-background px-8 dark:bg-dark-bg">
      <Animated.View key={index} entering={FadeInRight.duration(350)}>
        <View className="mb-6 items-center">{slide.icon}</View>
        <Text className="mb-3 text-center text-3xl font-bold text-primary dark:text-dark-text">
          {t(slide.titleKey)}
        </Text>
        <Text className="mb-10 text-center text-lg text-gray-600 dark:text-gray-300">
          {t(slide.bodyKey)}
        </Text>
      </Animated.View>

      <View className="mb-8 flex-row justify-center">
        {SLIDES.map((_, i) => (
          <View
            key={i}
            className={`mx-1 h-2 w-2 rounded-full ${i === index ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
          />
        ))}
      </View>

      <Button
        title={isLast ? t('onboarding.getStarted') : t('common.next')}
        onPress={() => (isLast ? finish() : setIndex(index + 1))}
      />
      {!isLast && (
        <Pressable className="mt-4" onPress={finish}>
          <Text className="text-center text-secondary dark:text-accent">{t('common.skip')}</Text>
        </Pressable>
      )}
    </View>
  );
}
