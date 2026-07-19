import React from 'react';
import { Text, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  hint?: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <View className="mt-8 items-center px-6">
      <Text className="text-center text-lg text-gray-500 dark:text-gray-400">{title}</Text>
      {hint && (
        <Text className="mt-1 text-center text-sm text-gray-400 dark:text-gray-500">{hint}</Text>
      )}
    </View>
  );
}
