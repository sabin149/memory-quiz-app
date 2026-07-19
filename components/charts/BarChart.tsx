import React from 'react';
import { Text, View } from 'react-native';

interface BarChartProps {
  /** Value 0-100 per bucket; null renders an empty slot. */
  values: (number | null)[];
  /** Only first and last labels are rendered. */
  labels: string[];
  height?: number;
  colorFor?: (value: number) => string;
}

const defaultColor = (v: number) =>
  v >= 70 ? 'bg-green-500' : v >= 40 ? 'bg-yellow-500' : 'bg-red-400';

/** Simple percentage bar chart built from plain views. */
export default function BarChart({ values, labels, height = 120, colorFor = defaultColor }: BarChartProps) {
  return (
    <View>
      <View className="flex-row items-end justify-between" style={{ height }}>
        {values.map((v, i) => (
          <View key={i} className="mx-0.5 flex-1 justify-end" style={{ height }}>
            {v === null ? (
              <View className="h-1 rounded-t bg-gray-200 dark:bg-gray-700" />
            ) : (
              <View
                className={`rounded-t ${colorFor(v)}`}
                style={{ height: Math.max(4, (v / 100) * height) }}
              />
            )}
          </View>
        ))}
      </View>
      <View className="mt-1 flex-row justify-between">
        <Text className="text-xs text-gray-500 dark:text-gray-400">{labels[0]}</Text>
        <Text className="text-xs text-gray-500 dark:text-gray-400">{labels[labels.length - 1]}</Text>
      </View>
    </View>
  );
}
