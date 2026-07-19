import React from 'react';
import { Text, View } from 'react-native';
import { dayKey } from '@/utils/gamification';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 16;

function cellClass(count: number): string {
  if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
  if (count === 1) return 'bg-green-300';
  if (count <= 3) return 'bg-green-500';
  return 'bg-green-700';
}

/** GitHub-style contribution calendar of quiz activity (last 16 weeks). */
export default function Heatmap({ activity }: { activity: Record<string, number> }) {
  const now = new Date();
  // End the grid on the current week's Saturday so columns are whole weeks.
  const end = new Date(now.getTime() + (6 - now.getDay()) * DAY_MS);

  const weeks: { day: string; count: number; future: boolean }[][] = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    const column: { day: string; count: number; future: boolean }[] = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(end.getTime() - (w * 7 + d) * DAY_MS);
      const key = dayKey(date);
      column.push({ day: key, count: activity[key] ?? 0, future: date > now });
    }
    weeks.push(column);
  }

  return (
    <View>
      <View className="flex-row">
        {weeks.map((column, i) => (
          <View key={i} className="mr-1">
            {column.map(({ day, count, future }) => (
              <View
                key={day}
                className={`mb-1 h-3 w-3 rounded-sm ${future ? 'bg-transparent' : cellClass(count)}`}
              />
            ))}
          </View>
        ))}
      </View>
      <View className="mt-1 flex-row items-center">
        <Text className="mr-1 text-xs text-gray-500 dark:text-gray-400">Less</Text>
        {[0, 1, 2, 4].map((c) => (
          <View key={c} className={`mr-1 h-3 w-3 rounded-sm ${cellClass(c)}`} />
        ))}
        <Text className="text-xs text-gray-500 dark:text-gray-400">More</Text>
      </View>
    </View>
  );
}
