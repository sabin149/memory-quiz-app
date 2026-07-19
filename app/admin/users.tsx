import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { fetchAttemptsSince } from '@/services/admin';
import { fetchEventsSince } from '@/services/analytics';
import { computeUserSummaries, UserSummary } from '@/utils/adminStats';

const WINDOW_DAYS = 30;
const PAGE = 25;

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [sortBy, setSortBy] = useState<'recent' | 'quizzes' | 'accuracy'>('recent');

  const visible = useMemo(() => {
    if (!users) return null;
    const q = query.trim().toLowerCase();
    const filtered = q ? users.filter((u) => u.ownerId.toLowerCase().includes(q)) : users;
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'quizzes') return b.quizzes - a.quizzes;
      if (sortBy === 'accuracy') return (b.avgScorePct ?? -1) - (a.avgScorePct ?? -1);
      return b.lastActiveAt.localeCompare(a.lastActiveAt);
    });
    return { items: sorted.slice(0, limit), total: sorted.length };
  }, [users, query, limit, sortBy]);

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
      <View className="mb-3 flex-row items-center rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-800">
        <Ionicons name="search-outline" size={16} color="#9CA3AF" />
        <TextInput
          className="flex-1 p-2.5 text-black dark:text-white"
          placeholder="Filter by user id"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setLimit(PAGE);
          }}
          autoCapitalize="none"
          accessibilityLabel="Filter users by id"
        />
      </View>
      <View className="mb-3 flex-row">
        {(
          [
            { value: 'recent', label: 'Recent' },
            { value: 'quizzes', label: 'Most quizzes' },
            { value: 'accuracy', label: 'Accuracy' },
          ] as const
        ).map(({ value, label }) => (
          <Pressable
            key={value}
            className={`mr-2 rounded-full border px-3 py-1.5 ${
              sortBy === value
                ? 'border-primary bg-primary'
                : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
            }`}
            onPress={() => setSortBy(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: sortBy === value }}
          >
            <Text
              className={
                sortBy === value ? 'text-xs font-semibold text-white' : 'text-xs text-black dark:text-dark-text'
              }
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={visible?.items ?? []}
        keyExtractor={(item) => item.ownerId}
        ListFooterComponent={
          visible && visible.total > visible.items.length ? (
            <Pressable
              className="mt-2 rounded-lg bg-primary p-3 active:opacity-80"
              onPress={() => setLimit((l) => l + PAGE)}
              accessibilityRole="button"
            >
              <Text className="text-center font-semibold text-white">
                Show more ({visible.items.length} of {visible.total})
              </Text>
            </Pressable>
          ) : null
        }
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
