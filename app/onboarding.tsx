import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useQuizStore } from '@/store';

function PulseRing({ delay, size }: { delay: number; size: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1, false)
    );
  }, [delay, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.9 }],
    opacity: 0.45 * (1 - progress.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        style,
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: '#fff',
        },
      ]}
    />
  );
}

/** Hero icon with breathing float + expanding pulse rings. */
function Hero({ children }: { children: React.ReactNode }) {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [float]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -8 * float.value }],
  }));

  return (
    <View className="h-48 items-center justify-center">
      <PulseRing delay={0} size={132} />
      <PulseRing delay={1200} size={132} />
      <Animated.View
        style={style}
        className="h-32 w-32 items-center justify-center rounded-full bg-white/15"
      >
        <View className="h-24 w-24 items-center justify-center rounded-full bg-white/90">
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const setHasOnboarded = useQuizStore((s) => s.setHasOnboarded);
  const [index, setIndex] = useState(0);

  const SLIDES = [
    {
      icon: <MaterialCommunityIcons name="head-question-outline" size={52} color="#4B5EAA" />,
      title: t('onboarding.slide1Title'),
      body: t('onboarding.slide1Body'),
    },
    {
      icon: <Ionicons name="cloud-upload-outline" size={52} color="#4B5EAA" />,
      title: t('onboarding.slide2Title'),
      body: t('onboarding.slide2Body'),
    },
    {
      icon: <Ionicons name="school-outline" size={52} color="#4B5EAA" />,
      title: t('onboarding.slide3Title'),
      body: t('onboarding.slide3Body'),
    },
  ];
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = () => {
    setHasOnboarded(true);
    router.replace('/register');
  };

  return (
    <LinearGradient
      colors={['#39468C', '#4B5EAA', '#2A3563']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1 justify-between px-8 py-16">
        <View className="items-end">
          {!isLast && (
            <Pressable onPress={finish} accessibilityRole="button" hitSlop={8}>
              <Text className="text-white/70">{t('common.skip')}</Text>
            </Pressable>
          )}
        </View>

        <Animated.View key={index} entering={FadeInRight.duration(350)}>
          <Hero>{slide.icon}</Hero>
          <Text className="mb-3 mt-6 text-center text-3xl font-extrabold text-white">
            {slide.title}
          </Text>
          <Text className="text-center text-lg leading-7 text-white/80">{slide.body}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400)}>
          <View className="mb-8 flex-row justify-center">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={`mx-1 h-2 rounded-full ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
              />
            ))}
          </View>
          <Pressable
            className="rounded-2xl bg-white p-4 active:opacity-90"
            onPress={() => (isLast ? finish() : setIndex(index + 1))}
            accessibilityRole="button"
          >
            <Text className="text-center text-base font-bold text-primary">
              {isLast ? t('onboarding.getStarted') : t('common.next')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}
