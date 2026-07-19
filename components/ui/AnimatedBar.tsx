import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface AnimatedBarProps {
  /** Fill percentage 0-100. */
  pct: number;
  colorClass: string;
  heightClass?: string;
}

/** Horizontal progress bar that animates to its value. */
export default function AnimatedBar({ pct, colorClass, heightClass = 'h-2' }: AnimatedBarProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, pct)) / 100, { duration: 700 });
  }, [pct, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View
      className={`${heightClass} flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700`}
    >
      <Animated.View
        style={[fillStyle, { transformOrigin: 'left' }]}
        className={`${heightClass} w-full rounded-full ${colorClass}`}
      />
    </View>
  );
}
