import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { fetchLeaderboard } from '@/services/leaderboard';
import { useQuizStore } from '@/store';

const MEDALS = ['#FFD166', '#C0C4CC', '#CD7F32'];

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const user = useQuizStore((s) => s.user);
  const optIn = useQuizStore((s) => s.leaderboardOptIn);
  const setLeaderboardOptIn = useQuizStore((s) => s.setLeaderboardOptIn);
  const [orderBy, setOrderBy] = useState<'totalXp' | 'streak'>('totalXp');
  const [joining, setJoining] = useState(false);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['leaderboard', orderBy],
    queryFn: () => fetchLeaderboard(orderBy),
  });

  const join = async () => {
    setJoining(true);
    try {
      await setLeaderboardOptIn(true);
      Toast.show({ type: 'success', text1: t('leaderboard.joined') });
      refetch();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('leaderboard.joinFailed'),
        text2: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <View className="flex-1 bg-background px-4 py-4 dark:bg-dark-bg sm:px-6">
      <View className="mb-3 flex-row overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
        {(
          [
            { value: 'totalXp', label: t('leaderboard.byXp'), icon: 'star-outline' },
            { value: 'streak', label: t('leaderboard.byStreak'), icon: 'flame-outline' },
          ] as const
        ).map(({ value, label, icon }) => (
          <Pressable
            key={value}
            className={`flex-1 flex-row items-center justify-center p-3 ${orderBy === value ? 'bg-primary' : 'bg-white dark:bg-gray-800'}`}
            onPress={() => setOrderBy(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: orderBy === value }}
          >
            <Ionicons
              name={icon}
              size={16}
              color={orderBy === value ? '#fff' : '#9CA3AF'}
              style={{ marginRight: 6 }}
            />
            <Text
              className={
                orderBy === value ? 'font-semibold text-white' : 'text-black dark:text-dark-text'
              }
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {!optIn && (
        <Card className="mb-3 border-l-4 border-l-primary">
          <Text className="mb-2 text-sm text-gray-600 dark:text-gray-300">
            {t('leaderboard.optInHint')}
          </Text>
          <Button
            title={t('leaderboard.join')}
            icon="trophy-outline"
            onPress={join}
            loading={joining}
          />
        </Card>
      )}

      {isError ? (
        <View className="flex-1 justify-center">
          <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">
            {t('leaderboard.loadFailed')}
          </Text>
          <Button title={t('common.retry')} icon="refresh-outline" onPress={() => refetch()} />
        </View>
      ) : isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.$id}
          renderItem={({ item, index }) => {
            const mine = item.$id === user?.$id;
            return (
              <Card
                className={`mb-2 py-3 ${mine ? 'border-2 border-primary' : ''}`}
              >
                <View className="flex-row items-center">
                  <View className="w-9 items-center">
                    {index < 3 ? (
                      <Ionicons name="medal" size={20} color={MEDALS[index]} />
                    ) : (
                      <Text className="font-bold text-gray-400 dark:text-gray-500">
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <Text
                    className="ml-2 flex-1 font-semibold text-black dark:text-dark-text"
                    numberOfLines={1}
                  >
                    {item.name}
                    {mine ? ` (${t('leaderboard.you')})` : ''}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="flame" size={14} color="#FF6F61" />
                    <Text className="ml-0.5 mr-3 text-sm text-black dark:text-dark-text">
                      {item.streak}
                    </Text>
                    <Ionicons name="star" size={14} color="#FFD166" />
                    <Text className="ml-0.5 text-sm text-black dark:text-dark-text">
                      {item.totalXp}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
              {t('leaderboard.empty')}
            </Text>
          }
        />
      )}
    </View>
  );
}
