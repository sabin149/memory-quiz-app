import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { fetchAttemptsSince } from '@/services/admin';
import { fetchEventsSince } from '@/services/analytics';
import { computeUserSummaries, UserSummary } from '@/utils/adminStats';

const WINDOW_DAYS = 30;

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setUsers(null);
    try {
      const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const [events, attempts] = await Promise.all([
        fetchEventsSince(since),
        fetchAttemptsSince(since),
      ]);
      setUsers(
        computeUserSummaries(
          events.map((e) => ({ name: e.name, ownerId: e.ownerId, createdAt: e.$createdAt })),
          attempts.map((a) => ({
            ownerId: a.ownerId,
            scorePct: a.scorePct,
            completedAt: a.completedAt,
          }))
        )
      );
    } catch {
      setError('Could not load user activity.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View className="flex-1 justify-center bg-background px-6 dark:bg-dark-bg">
        <Text className="mb-4 text-center text-gray-500 dark:text-gray-400">{error}</Text>
        <Pressable className="rounded-lg bg-primary p-3" onPress={load}>
          <Text className="text-center font-semibold text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!users) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 py-6 dark:bg-dark-bg sm:px-6">
      <Text className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Last {WINDOW_DAYS} days · {users.length} active user{users.length === 1 ? '' : 's'} ·
        identified by user id only
      </Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.ownerId}
        renderItem={({ item }) => (
          <Pressable
            className="mb-2 rounded-lg bg-white p-4 shadow dark:bg-gray-800"
            onPress={() =>
              router.push({ pathname: '/admin/user/[userId]', params: { userId: item.ownerId } })
            }
          >
            <Text className="font-mono text-sm text-black dark:text-dark-text" numberOfLines={1}>
              {item.ownerId}
            </Text>
            <Text className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Last active {new Date(item.lastActiveAt).toLocaleString()} · {item.eventCount} events
              · {item.quizzes} quizzes
              {item.avgScorePct != null ? ` · avg ${item.avgScorePct}%` : ''}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-gray-500 dark:text-gray-400">
            No activity recorded yet.
          </Text>
        }
      />
    </View>
  );
}
