import React from 'react';
import { Text, View } from 'react-native';
import { memoryStrength, strengthColorClass } from '@/utils/memoryStrength';
import type { MemoryState } from '@/utils/sm2';

/** The core value prop made visible: how well this item is remembered now. */
export default function StrengthBar({ memory }: { memory: MemoryState }) {
  const strength = memoryStrength(memory);
  return (
    <View className="mt-2 flex-row items-center">
      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <View
          className={`h-1.5 rounded-full ${strengthColorClass(strength)}`}
          style={{ width: `${strength}%` }}
        />
      </View>
      <Text className="ml-2 w-16 text-right text-xs text-gray-500 dark:text-gray-400">
        {memory.lastReviewedAt ? `${strength}%` : 'new'}
      </Text>
    </View>
  );
}
