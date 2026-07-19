import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Heatmap from '@/components/Heatmap';
import Card from '@/components/ui/Card';
import { useQuizStore } from '@/store';
import { ACHIEVEMENTS, computeStreak, levelFromXp } from '@/utils/gamification';

export default function StatsScreen() {
  const gamification = useQuizStore((s) => s.gamification);
  const conversations = useQuizStore((s) => s.conversations);

  const streak = computeStreak(gamification.activity);
  const level = levelFromXp(gamification.totalXp);
  const masteredCount = conversations.filter((c) => c.memory.repetitions >= 3).length;
  const ctx = { gamification, streak, conversationCount: conversations.length, masteredCount };

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-4 py-6 sm:px-6"
    >
      <View className="mb-4 flex-row">
        <Card className="mr-3 flex-1 items-center">
          <Text className="text-3xl font-bold text-secondary">{streak}🔥</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Day streak</Text>
        </Card>
        <Card className="mr-3 flex-1 items-center">
          <Text className="text-3xl font-bold text-primary dark:text-dark-text">
            {level.level}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Level</Text>
        </Card>
        <Card className="flex-1 items-center">
          <Text className="text-3xl font-bold text-primary dark:text-dark-text">
            {gamification.totalXp}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Total XP</Text>
        </Card>
      </View>

      <Card className="mb-4">
        <View className="mb-1 flex-row justify-between">
          <Text className="text-sm text-black dark:text-dark-text">
            Level {level.level} → {level.level + 1}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {level.xpIntoLevel}/{level.xpForNextLevel} XP
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <View className="h-2 rounded-full bg-accent" style={{ width: `${level.progressPct}%` }} />
        </View>
      </Card>

      <Card className="mb-4">
        <Text className="mb-3 font-semibold text-black dark:text-dark-text">Review activity</Text>
        <Heatmap activity={gamification.activity} />
        <Text className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {gamification.quizzesCompleted} quizzes · {gamification.perfectQuizzes} perfect ·{' '}
          {masteredCount} mastered
        </Text>
      </Card>

      <Text className="mb-2 font-semibold text-black dark:text-dark-text">Achievements</Text>
      {ACHIEVEMENTS.map((achievement) => {
        const unlocked = achievement.unlocked(ctx);
        return (
          <Card key={achievement.id} className={`mb-2 ${unlocked ? '' : 'opacity-50'}`}>
            <View className="flex-row items-center justify-between">
              <View className="mr-2 flex-1">
                <Text className="font-semibold text-black dark:text-dark-text">
                  {achievement.title}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {achievement.description}
                </Text>
              </View>
              <Text className="text-xl">{unlocked ? '🏆' : '🔒'}</Text>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}
